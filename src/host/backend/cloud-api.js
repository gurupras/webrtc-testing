class CloudAPI {
  constructor (config) {
    this.config = config
  }

  async getInstances () {
    throw new Error('Unimplemented')
  }

  async createInstance (config) {
    throw new Error('Unimplemented')
  }

  async destroyInstance (instance) {
    throw new Error('Unimplemented')
  }
}

module.exports = CloudAPI
