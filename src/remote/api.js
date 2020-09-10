const { nanoid } = require('nanoid')

const express = require('express')
const bodyParser = require('body-parser')

const base = require('./puppeteer-base')
const Tab = require('./tab')
const config = require('../../config')

const { Logger } = require('@gurupras/log')
const log = new Logger('remote:api', 'debug')

const app = express()
app.use(bodyParser.json())

let browser
let token
const tabs = {}

async function getBrowser () {
  if (!browser) {
    browser = await base.newBrowser(config.browser)
  }
  return browser
}

async function createNewTab (id) {
  const browser = await getBrowser()
  const page = await base.newPage(browser)
  const token = await getAccessToken()
  const tab = new Tab(id, page, token)
  tabs[id] = tab
  return tab
}

async function getAccessToken () {
  if (!token) {
    token = await base.getAccessToken(config.auth0, config.accounts.test)
  }
  return token
}

app.get('/tabs', async (req, res) => {
  res.send(tabs)
})

app.post('/tab/create(/:id)?', async (req, res) => {
  const { params: { id = nanoid() } } = req
  try {
    await createNewTab(id)
    log.info(`Create tab: ${id}`)
    res.send(id)
  } catch (e) {
    log.error('Failed to create tab', e)
    res.status(500).send(e)
  }
})

app.post('/tab/:tabID/join', async (req, res) => {
  const { params: { tabID } } = req
  const { body: { roomName } } = req
  const { [tabID]: tab } = tabs
  if (!tab) {
    return res.status(400).send(`No tab with tabID '${tabID}'`)
  }
  try {
    await tab.joinRoom(roomName)
    res.send('OK')
  } catch (e) {
    log.error(`Failed to load room on tab-${tabID}`, e)
    res.status(500).send(e)
  }
})

app.post('/tab/:tabID/:device(webcam|mic)/:operation(start|stop|toggle)', async (req, res) => {
  const { params: { tabID, device, operation } } = req
  const { [tabID]: tab } = tabs
  if (!tab) {
    return res.status(400).send(`No tab with tabID '${tabID}'`)
  }

  const fnName = `${operation}${device.slice(0, 1).toUpperCase() + device.slice(1)}`
  log.info(`Attempting to ${fnName}`)
  try {
    await tab[fnName]()
    res.send('OK')
  } catch (e) {
    log.error(`Failed to ${operation} ${device}`, e)
    res.status(500).send(`Failed to ${operation} ${device}`)
  }
})

app.get('/tab/:tabID/stats', async (req, res) => {
  const { params: { tabID } } = req
  const { [tabID]: tab } = tabs
  if (!tab) {
    return res.status(400).send(`No tab with tabID '${tabID}'`)
  }
  const stats = await tab.getStats()
  // log.info('Got stats', { tabID, stats })
  res.send(stats)
})

app.get('/tab/:tabID/screenshot', async (req, res) => {
  const { params: { tabID }, query } = req
  const { [tabID]: tab } = tabs
  if (!tab) {
    return res.status(400).send(`No tab with tabID '${tabID}'`)
  }

  const data = await tab.screenshot(query)
  res.type('application/octet-stream')
  res.send(data)
})

app.delete('/tab/:tabID/close', async (req, res) => {
  const { params: { tabID } } = req
  const { [tabID]: tab } = tabs
  if (!tab) {
    return res.status(400).send(`No tab with tabID '${tabID}'`)
  }
  await tab.close()
  delete tabs[tabID]
  res.send('OK')
})

module.exports = {
  app,
  tabs
}
