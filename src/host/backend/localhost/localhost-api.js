const axios = require('axios')
const { nanoid } = require('nanoid')
const CloudAPI = require('../cloud-api')
const CloudInstance = require('../cloud-instance')

const { Logger } = require('@gurupras/log')
const log = new Logger('localhost-api')

class LocalhostAPI extends CloudAPI {
  constructor (config) {
    super(config)
    const { port } = config
    this.host = `localhost:${port}`
    this.client = axios.create({
      baseURL: `http://${this.host}`
    })
    this.instances = []
    this.instanceMap = {}
  }

  async discoverInstances () {
    const { client, host } = this
    await client.get('/tabs')
    const instance = new CloudInstance(host, { id: nanoid() })
    this.instances.push(instance)
    this.instanceMap[instance.id] = instance
    log.info('Successfully connected to remote-localhost and retrieved information')
  }
}

module.exports = LocalhostAPI
