class BaseCloudTab {
  constructor (id) {
    Object.assign(this, {
      id,
      room: null,
      webcam: false,
      mic: false
    })
  }

  async joinRoom (roomName) {
    this.room = roomName
  }

  async startWebcam () {
    this.webcam = true
  }

  async stopWebcam () {
    this.webcam = false
  }

  async startMic () {
    this.mic = true
  }

  async stopMic () {
    this.mic = false
  }
}

module.exports = BaseCloudTab
