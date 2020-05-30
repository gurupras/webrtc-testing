const puppeteer = require('puppeteer')
const Emittery = require('emittery')
const deepmerge = require('deepmerge')

const randomstring = require('randomstring')
const { AuthenticationClient } = require('auth0')

var PROTOCOL = 'https:'
var HOST = 'video.twoseven.xyz'

const LANDING_PAGE_FRAGMENT = ''
const HOME_PAGE_FRAGMENT = 'home'

let log
if (process.env.DEBUG) {
  log = (...args) => {
    console.log('TEST:', ...args)
  }
} else {
  log = (...args) => {}
}

function rejectWrap (fn) {
  return fn
}

async function exposeFunctions (page, data) {
  var keys = Object.keys(data)
  log(`keys: ${keys}`)

  for (var idx = 0; idx < keys.length; idx++) {
    const key = keys[idx]
    const fn = data[key]
    await page.exposeFunction(key, function (...args) {
      log(`Called exposed '${key}' function: ${JSON.stringify(args)}`)
      fn(...args)
    })
    log(`Set up ${key}`)
  }
  return Object.keys(data)
}

async function logout (page, auth0) {
  const logoutUrl = `${PROTOCOL}//${HOST}/logout`
  await page.goto(logoutUrl)
}

async function getAccessToken (auth0, userData) {
  const authClient = new AuthenticationClient({
    domain: auth0.domain,
    client_id: auth0.client_id,
    client_secret: auth0.client_secret,
    clientId: auth0.client_id,
    clientSecret: auth0.client_secret
  })
  const tokens = await authClient.passwordGrant(userData)
  return tokens.access_token
}

async function login (page, userData) {
  const promise = page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(function () {
        reject(new Error('Failed to login'))
      }, 20000)

      window.appBus.$once('auth0-profile-available', (profile) => {
        console.log('Received auth0-profile-available event')
        clearTimeout(timeout)
        resolve(profile)
      })
      window.getAuth0Lock().on('authenticated', function (obj) {
        console.log('Auth0 authenticated: ' + obj.idToken)
      })
      window.getAuth0Lock().on('authorization_error', function (err) {
        clearTimeout(timeout)
        reject(err)
      })
    })
  })

  await page.click('#login')
  try {
    await page.waitForSelector('button.auth0-lock-submit', {
      visible: true,
      timeout: 1000
    })
  } catch (e) {
    // Didn't get the submit button..probably because there is another account logged in
    log('Did not find auth0-lock-submit button')
    const selector = 'a.auth0-lock-alternative-link'
    await page.click(selector)
  }
  await page.waitForSelector('input[type="email"]', {
    visible: true
  })
  await page.focus('input[type="email"]')
  await page.type('input[type="email"]', userData.username)
  await page.focus('input[type="password"]')
  await page.type('input[type="password"]', userData.password)
  await page.click('button.auth0-lock-submit')
  return promise
}

async function loadTestFunctions (page) {
  return page.evaluate(() => {
    localStorage.__testing__ = '1'
    window.testing = true
    window.getAuth0Lock = function () { return window.app.$store.getters.auth0Lock }
  })
}

async function waitForLandingPage (page) {
  return page.waitForSelector('#landing-heading', { timeout: 3000 })
}
async function loadLandingPage (page) {
  await page.goto(landingPageUrl())
  await page.waitForFunction('app.$store.getters.auth0Lock !== undefined')
  await loadTestFunctions(page)
  return waitForLandingPage(page)
}

async function loadHomePage (page, userData) {
  await loadLandingPage(page)
  await login(page, userData)
  await page.waitFor('.create-room-button', { timeout: 3000 })
}

async function loadRoomPageWithToken (page, roomName, token) {
  await loadLandingPage(page)
  await page.evaluate((token) => {
    sessionStorage.setItem('auth0-accessToken', token)
  }, token)
  await page.goto(roomPageUrl(roomName))
  await page.waitForFunction('app && app.$store.getters.isRoom')
}

async function loadRoomPage (page, userData, roomName) {
  await page.goto(roomPageUrl(roomName))
  await loadTestFunctions(page)
  await login(page, userData)
  await page.waitForFunction('app && app.$store.getters.isRoom')
}

async function toggleWebcam (page, getState = false) {
  await page.bringToFront()
  await page.click('.webcam-toggle-container a[data-tag="toggle-webcam"] > i')
  if (getState) {
    return getWebcamState(page)
  }
}

async function toggleMic (page, getState = false) {
  await page.bringToFront()
  await page.click('.webcam-toggle-container a[data-tag="toggle-mic"] > i')
  if (getState) {
    return getMicState(page)
  }
}

async function getWebcamState (page) {
  return page.evaluate(() => window.webcamApp.selfWebcamStream && window.webcamApp.selfWebcamStream.getVideoTracks().length > 0)
}

async function _toggleWebcam (page, state) {
  const isWebcamOn = await getWebcamState(page)
  if (isWebcamOn === !!state) {
    return isWebcamOn
  }
  return toggleWebcam(page)
}

async function startWebcam (page) {
  return _toggleWebcam(page, true)
}

async function stopWebcam (page) {
  return _toggleWebcam(page, false)
}

async function getMicState (page) {
  return page.evaluate(() => window.webcamApp.selfWebcamStream && window.webcamApp.selfWebcamStream.getAudioTracks().length > 0)
}

async function _toggleMic (page, state) {
  const isMicOn = await getMicState(page)
  if (isMicOn === !!state) {
    return isMicOn
  }
  return toggleMic(page)
}

async function startMic (page) {
  return _toggleMic(page, true)
}

async function stopMic (page) {
  return _toggleMic(page, false)
}

async function loadClient (browserOpts, logOpts, auth0, userData, roomName) {
  const browser = await newBrowser()
  const page = await newPage(browser, browserOpts, logOpts, userData)
  await loadRoomPage(page, auth0, userData, roomName)
  return {
    browser: browser,
    page: page
  }
}

async function loadNClients (auth0, userDatas, roomName) {
  const clients = []

  const obj = new Emittery()
  obj.on('client-done', () => {
    log('Client loaded..')
    if (clients.length === userDatas.length) {
      log('All clients loaded. Firing load-n-clients-done')
      obj.emit('load-n-clients-done')
    }
  })

  function _loadClient (idx) {
    const logOpts = { logPrefix: `PAGE-${idx + 1}` }
    loadClient(null, logOpts, auth0, userDatas[idx], roomName).then((client) => {
      clients.push(client)
      obj.emit('client-done')
    })
  }
  for (let i = 0; i < userDatas.length; i++) {
    _loadClient(i)
  }

  async function getRoomUsers (page) {
    return page.evaluate(async () => {
      const socket = await waitForSocket()
      return new Promise((resolve, reject) => {
        socket.once('room-users', resolve)
        socket.emit('get-room-users')
      })
    })
  }

  async function _testRoomUsers () {
    const datas = []
    for (let i = 0; i < userDatas.length; i++) {
      const data = await getRoomUsers(clients[i].page)
      datas.push(data)
    }

    return new Promise((resolve, reject) => {
      log('Checking room-users from all clients...')
      for (let i = 0; i < userDatas.length; i++) {
        log('data: ' + JSON.stringify(datas[i]))
        if (JSON.stringify(datas[0]) !== JSON.stringify(datas[i])) {
          log('data1: ' + JSON.stringify(datas[0]))
          log('data2: ' + JSON.stringify(datas[i]))
          resolve(new Error('get-room-users data did not match across clients'))
        }
      }
      resolve(clients)
    })
  }

  return new Promise((resolve, reject) => {
    obj.on('load-n-clients-done', function () {
      log('load-n-clients-done event fired!')
      _testRoomUsers().then((obj) => {
        resolve(obj)
      })
    })
  })
}

async function newBrowser (opts) {
  const defaults = {
    headless: true,
    slowMo: 30,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=en-US'
    ]
  }
  if (!opts) {
    opts = {}
  }
  const conf = deepmerge(defaults, opts)
  const browser = await puppeteer.launch(conf)
  return browser
}

async function newPage (browser, pageOpts, initOpts) {
  const page = await browser.newPage(pageOpts)
  await initPage(page, initOpts)
  return page
}

async function initPage (page, opts = {}) {
  const defaultOpts = {
    logPrefix: 'PAGE:'
  }
  opts = deepmerge(defaultOpts, opts)

  if (process.env.DEBUG) {
    page.on('console', (...args) => console.log(opts.logPrefix, ...args))
  }
  page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36')

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    })
  })

  // Pass the Chrome Test.
  await page.evaluateOnNewDocument(() => {
    // We can mock this in as much depth as we need for the test.
    window.navigator.chrome = {
      runtime: {}
      // etc.
    }
  })

  // Pass the Permissions Test.
  await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    )
  })

  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'plugins', {
      // This just needs to have `length > 0` for the current test,
      // but we could mock the plugins too if necessary.
      get: () => [1, 2, 3, 4, 5]
    })
  })

  await page.evaluateOnNewDocument(() => {
    // Overwrite the `plugins` property to use a custom getter.
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    })
  })

  // Expose some common functions
  await page.exposeFunction('generateRandomVariable', generateRandomVariable)
  await page.exposeFunction('waitForSocket', waitForSocket)
}

// Expected to be exposed on the page
async function waitForSocket () {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (window.app) {
        const socket = window.app.$store.getters.socket
        if (socket) {
          clearInterval(interval)
          return resolve(socket)
        }
      }
      if (now - start > 3 * 1000) {
        clearInterval(interval)
        reject(new Error('Took too long to load'))
      }
    })
  })
}

function landingPageUrl () {
  return `${PROTOCOL}//${HOST}/${LANDING_PAGE_FRAGMENT}`
}

function homePageUrl () {
  return `${PROTOCOL}//${HOST}/${HOME_PAGE_FRAGMENT}`
}

function roomPageUrl (room) {
  return `${PROTOCOL}//${HOST}/${room}`
}

function generateRandomVariable () {
  return randomstring.generate({
    length: 32,
    charset: 'alphabetic'
  })
}

async function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

module.exports = {
  newBrowser,
  newPage,
  initPage,
  login,
  getAccessToken,
  logout,
  exposeFunctions,
  loadLandingPage,
  loadHomePage,
  loadRoomPage,
  loadRoomPageWithToken,
  loadNClients,
  startWebcam,
  stopWebcam,
  startMic,
  stopMic,
  log,
  rejectWrap,
  landingPageUrl,
  homePageUrl,
  generateRandomVariable,
  sleep,
  waitForLandingPage
}
