const DigitalOceanAPI = require('@gurupras/digitalocean-simple-api')
const CloudAPI = require('./cloud-api')
const CloudInstance = require('./cloud-instance')

const { Logger } = require('@gurupras/log')

const log = new Logger('do-cloud-api')

class DigitalOceanCloudAPI extends CloudAPI {
  constructor (config) {
    super(config)
    const { digitalocean: { token, dropletConfig }, remote: { port } } = config
    this.remotePort = port
    this.dropletConfig = dropletConfig
    this.client = new DigitalOceanAPI({ token }, log)
  }

  async createInstance (config = this.dropletConfig) {
    const { remotePort } = this
    const dropletInfo = await this.client.createDroplet(config, {})
    const { droplet: { id, networks: { v4 } } } = dropletInfo
    const [{ ip_address: dropletIP }] = v4

    const instance = new CloudInstance(`${dropletIP}:${remotePort}`, { id, ...dropletInfo })
    super.addInstance(instance)
    return instance
  }

  async destroyInstance (instance) {
    let instanceID
    if (typeof instance === 'object') {
      const { droplet: { id } } = instance
      instanceID = id
    } else {
      instanceID = instance
    }
    if (!instanceID) {
      throw new Error('Must specify at least a droplet ID to destroy')
    }
    const { client } = this
    await client.destroyDroplet(instanceID)
    super.removeInstance(instanceID)
  }
}

module.exports = DigitalOceanCloudAPI
