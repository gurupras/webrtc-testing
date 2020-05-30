const base = require('./puppeteer-base')
const BaseCloudTab = require('../host/backend/base-cloud-tab')
const pageMap = new WeakMap()
const tokenMap = new WeakMap()

class Tab extends BaseCloudTab {
  constructor (id, page, token) {
    super(id)
    tokenMap.set(this, token)
    pageMap.set(this, page)
  }

  async joinRoom (roomName) {
    const { page, token } = this
    await base.loadRoomPageWithToken(page, roomName, token)
    super.joinRoom(roomName)
  }

  async close () {
    const { page } = this
    await page.close()
  }

  async startWebcam () {
    const { page } = this
    await base.startWebcam(page)
    super.startWebcam()
  }

  async stopWebcam () {
    const { page } = this
    await base.stopWebcam(page)
    super.stopWebcam()
  }

  async toggleWebcam () {
    const { page } = this
    this.webcam = await base.toggleWebcam(page, true)
  }

  async startMic () {
    const { page } = this
    await base.startMic(page)
    super.startMic()
  }

  async stopMic () {
    const { page } = this
    await base.stopMic(page)
    super.stopMic()
  }

  async toggleMic () {
    const { page } = this
    this.mic = await base.toggleMic(page)
  }

  get page () {
    return pageMap.get(this)
  }

  get token () {
    return tokenMap.get(this)
  }
}

module.exports = Tab
