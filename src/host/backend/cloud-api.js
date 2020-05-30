class CloudAPI {
  constructor (config) {
    this.config = config
    this.instances = []
    this.instanceMap = {}
  }

  async addInstance (instance) {
    const { id } = instance
    this.instances.push(instance)
    this.instanceMap[id] = instance
  }

  async removeInstance (instanceID) {
    const instanceIdx = this.instances.find((x) => x.id === instanceID)
    this.instances.splice(instanceIdx, 1)
    delete this.instanceMap[instanceID]
  }

  async discoverInstances () {
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
