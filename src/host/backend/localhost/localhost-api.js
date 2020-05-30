const axios = require('axios')
const { nanoid } = require('nanoid')
const CloudAPI = require('../cloud-api')
const CloudInstance = require('../cloud-instance')
const CloudTab = require('../cloud-tab')

const { Logger } = require('@gurupras/log')
const log = new Logger('localhost-api')

class MockCloudAPI extends CloudAPI {
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

  async getInstances () {
    const { client, host } = this
    try {
      const response = await client.get('/tabs')
      const { data: tabs } = response
      const instance = new CloudInstance(host, { id: nanoid() })
      for (const [id, tabData] of Object.entries(tabs)) {
        const tab = new CloudTab(id, `http://${host}`, tabData)
        instance.tabs.push(tab)
        instance.tabsMap[id] = tab
      }
      this.instances.push(instance)
      this.instanceMap[instance.id] = instance
      log.info('Successfully connected to remote-localhost and retrieved information')
    } catch (e) {
      log.error('Failed to get instances', e)
    }
  }
}

module.exports = MockCloudAPI
