const deepmerge = require('deepmerge')
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

  async getStats () {
    const { page, room } = this
    if (!room) {
      return []
    }
    return page.evaluate(async () => {
      const result = []
      try {
        const { app: { $store: { getters: { screenWebRTC, webcamWebRTC } } } } = window
        const data = {
          screen: screenWebRTC,
          webcam: webcamWebRTC
        }
        const stats = await Promise.all(Object.entries(data).map(async ([type, webRTC]) => {
          try {
            const consumers = Object.values(webRTC.mediasoupWebRTC.consumers)
            const stats = await Promise.all(consumers.map(async consumer => {
              const { type, streamType: kind } = consumer
              const rtcStats = await consumer.consumer.getStats()
              const stats = [...rtcStats]
              return {
                type,
                kind,
                stats
              }
            }))
            return stats
          } catch (e) {
            return []
          }
        }))
        for (const entries of stats) {
          result.push(...entries)
        }
      } catch (e) {
        console.error(e)
      }
      return result
    })
  }

  async screenshot (opts = {}) {
    const defaults = {
      type: 'jpeg',
      quality: 80,
      encoding: 'binary'
    }
    const options = deepmerge(defaults, opts)
    const { page } = this
    return page.screenshot(options)
  }

  get page () {
    return pageMap.get(this)
  }

  get token () {
    return tokenMap.get(this)
  }
}

module.exports = Tab
