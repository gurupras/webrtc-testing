const axios = require('axios')

const BaseCloudTab = require('./base-cloud-tab')

class CloudTab extends BaseCloudTab {
  constructor (id, url, props = {}) {
    super(id)
    this.client = axios.create({
      baseURL: url,
      timeout: 30000
    })
    Object.assign(this, props)
  }

  async _commonRequest (endpoint, method = 'post', ...args) {
    const { client, id } = this
    const response = await client[method](`/tab/${id}${endpoint}`, ...args)
    return response.data
  }

  async joinRoom (roomName) {
    await this._commonRequest('/join', 'post', { roomName })
    super.joinRoom(roomName)
  }

  async startWebcam () {
    await this._commonRequest('/webcam/start')
    super.startWebcam()
  }

  async stopWebcam () {
    await this._commonRequest('/webcam/stop')
    super.stopWebcam()
  }

  async startMic () {
    await this._commonRequest('/mic/start')
    super.startMic()
  }

  async stopMic () {
    await this._commonRequest('/mic/stop')
    super.stopMic()
  }
}

module.exports = CloudTab
