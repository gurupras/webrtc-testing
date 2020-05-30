const { nanoid } = require('nanoid')
const CloudAPI = require('../cloud-api')
const MockCloudInstance = require('./mock-cloud-instance')

const { Logger } = require('@gurupras/log')
const log = new Logger('mock-cloud-api')

const { randomSleep, randomIP } = require('./utils')

class MockCloudAPI extends CloudAPI {
  constructor (...args) {
    super(...args)
    this.instances = []
    this.instanceMap = {}
  }

  async createInstance () {
    const id = nanoid()
    const ip = randomIP()
    log.debug('Created instance', { id })
    const instance = new MockCloudInstance(ip, { id })
    await randomSleep(1000)
    super.addInstance(instance)
    return instance
  }

  async destroyInstance (instance) {
    let instanceID
    if (typeof instance === 'string') {
      instanceID = instance
    } else {
      instanceID = instance.id
    }
    if (!instanceID) {
      throw new Error('Must specify at least a droplet ID to destroy')
    }
    await randomSleep(1000)
    await super.removeInstance(instanceID)
  }
}

module.exports = MockCloudAPI
