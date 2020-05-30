const DigitalOceanAPI = require('@gurupras/digitalocean-simple-api')
const CloudAPI = require('./cloud-api')
const CloudInstance = require('./cloud-instance')

const { Logger } = require('@gurupras/log')

const log = new Logger('do-cloud-api')

class DigitalOceanCloudAPI extends CloudAPI {
  constructor (config) {
    super(config)
    const { token } = config
    this.client = new DigitalOceanAPI({ token }, log)
  }

  async createInstance (config = this.config.dropletConfig) {
    const dropletInfo = await this.client.createDroplet(config)
    const { droplet: { networks: { v4 } } } = dropletInfo
    const [{ ip_address: dropletIP }] = v4

    const instance = new CloudInstance(dropletIP, dropletInfo)
    this.instances[dropletIP] = instance
    return instance
  }

  async destroyInstance (instance) {
    let instanceID
    if (typeof instance === 'string') {
      instanceID = instance
    } else {
      const { droplet: { id } } = instance
      instanceID = id
    }
    if (!instanceID) {
      throw new Error('Must specify at least a droplet ID to destroy')
    }
    const { client } = this
    await client.destroyDroplet(instanceID)
  }
}

module.exports = DigitalOceanCloudAPI
