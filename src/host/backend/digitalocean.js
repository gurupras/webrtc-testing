const DigitalOceanAPI = require('@gurupras/digitalocean-simple-api')
const CloudAPI = require('./cloud-api')
const CloudInstance = require('./cloud-instance')

const { Logger } = require('@gurupras/log')

const log = new Logger('do-cloud-api')

class DigitalOceanCloudAPI extends CloudAPI {
  constructor (config) {
    super(config)
    const { digitalocean: { good_cpus: cpus, token, dropletConfig }, remote: { port } } = config
    this.cpus = cpus
    this.remotePort = port
    this.dropletConfig = dropletConfig
    this.client = new DigitalOceanAPI({ token }, log)
  }

  async createInstance (config = this.dropletConfig) {
    const { remotePort, cpus, client } = this

    let promise
    if (cpus.length > 0) {
      promise = client.createDropletWithCPU({ cpus }, config)
    } else {
      promise = client.createDroplet(config)
    }
    const dropletInfo = await promise
    const { droplet: { id } } = dropletInfo
    const dropletIP = this.client.getDropletIP(dropletInfo, 'public')

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
    try {
      // FIXME: do-wrapper currently throws an exception on destroy. Until this is fixed, we squelch the exception
      await client.destroyDroplet(instanceID)
    } catch (e) {
    }
    super.removeInstance(instanceID)
  }
}

module.exports = DigitalOceanCloudAPI
