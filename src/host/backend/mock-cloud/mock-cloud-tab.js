const { randomSleep } = require('./utils')

const BaseCloudTab = require('../base-cloud-tab')

class MockCloudTab extends BaseCloudTab {
  async joinRoom (roomName) {
    await randomSleep(1000)
    super.joinRoom(roomName)
  }

  async startWebcam () {
    await randomSleep(1000)
    super.startWebcam()
  }

  async stopWebcam () {
    await randomSleep(1000)
    super.stopWebcam()
  }

  async startMic () {
    await randomSleep(1000)
    super.startMic()
  }

  async stopMic () {
    await randomSleep(1000)
    super.stopMic()
  }
}

module.exports = MockCloudTab
