const fs = require('fs')
const path = require('path')
const http = require('http')
const express = require('express')
const IO = require('socket.io')
const { nanoid } = require('nanoid')
const Deferred = require('@gurupras/deferred')

const { Logger, globalLoggers, ConsoleLogger } = require('@gurupras/log')
globalLoggers.push(new ConsoleLogger())
const log = new Logger('host:server')

const DigitalOceanCloudAPI = require('./digitalocean')
const MockCloudAPI = require('./mock-cloud/mock-cloud-api')
const LocalhostAPI = require('./localhost/localhost-api')
const CloudInstance = require('./cloud-instance')

const config = require('../../../config')

const app = express()
const server = http.createServer(app)
// const cloudAPI = new DigitalOceanCloudAPI(config.digitalocean)

let cloudAPI
if (!config.api) {
  log.warn("Please specify 'apiType' in the config. Defaulting to a mock API")
  config.api = 'localhost'
}

switch (config.api) {
  case 'localhost':
    cloudAPI = new LocalhostAPI(config.remote)
    break
  case 'digitalocean':
    cloudAPI = new DigitalOceanCloudAPI(config.digitalocean)
    break
  case 'mock': // eslint-disable-line no-fallthrough
    cloudAPI = new MockCloudAPI()
    break
}

const retrievedInstancesDeferred = new Deferred()

;(async () => {
  try {
    await cloudAPI.discoverInstances()
    const failedInstances = []
    for (const instance of cloudAPI.instances) {
      try {
        await instance.discoverTabs()
      } catch (e) {
        log.error('Failed to retrieve tabs of discovered instance', { host: instance.host })
        failedInstances.push(instance.id)
      }
    }

    for (const instanceID of failedInstances) {
      cloudAPI.removeInstance(instanceID)
    }
  } catch (e) {
    log.debug('No localhost instances discovered')
  }
  retrievedInstancesDeferred.resolve()
})()

const io = new IO(server)

io.on('connection', socket => {
  socket.on('cloud-api:list', async (_, cb) => {
    await retrievedInstancesDeferred
    cb(cloudAPI.instances)
  })

  socket.on('cloud-api:create', async (_, cb) => {
    let result
    try {
      const instance = await cloudAPI.createInstance()
      result = instance
    } catch (e) {
      result = { error: e.message }
    }
    cb(result)
  })

  socket.on('cloud-api:destroy', async (id, cb) => {
    const result = {}
    if (!id) {
      result.error = 'No instance ID specified'
      return cb(result)
    }
    try {
      await cloudAPI.destroyInstance(id)
    } catch (e) {
      result.error = e.message
    }
    cb(result)
  })

  socket.on('cloud-api:add', async ({ host }, cb) => {
    const result = {}
    const instance = new CloudInstance(host, { id: nanoid() })
    try {
      // Make sure it works
      await instance.discoverTabs()
      socket.emit('cloud-api:add', instance)
      log.info('Manually added instance', { host, id: instance.id })
      cloudAPI.addInstance(instance)
    } catch (e) {
      result.error = 'Host does not seem to have a remote running'
      log.error('Manually added instance does not have expected endpoints', { host })
    }
    cb(result)
  })

  socket.on('tab:create', async ({ id }, cb) => {
    const { instanceMap: { [id]: instance } } = cloudAPI
    const tab = await instance.createTab()
    cb(tab)
  })

  socket.on('tab:close', async ({ instanceID, id: tabID }, cb) => {
    const { instanceMap: { [instanceID]: instance } } = cloudAPI
    await instance.closeTab(tabID)
    cb()
  })

  socket.on('tab:join', async ({ instanceID, id: tabID, roomName }, cb) => {
    const { instanceMap: { [instanceID]: instance } } = cloudAPI
    const { tabsMap: { [tabID]: tab } } = instance
    await tab.joinRoom(roomName)
    cb()
  })

  const devices = ['webcam', 'mic']
  const operations = ['start', 'stop', 'toggle']
  for (const device of devices) {
    for (const operation of operations) {
      const evt = `${device}:${operation}`
      socket.on(evt, async ({ instanceID, id: tabID }, cb) => {
        const { instanceMap: { [instanceID]: instance } } = cloudAPI
        const { tabsMap: { [tabID]: tab } } = instance
        const result = {}
        if (!tab) {
          result.error = 'Invalid tab ID'
          return cb(result)
        }
        const fn = `${operation}${device.slice(0, 1).toUpperCase()}${device.slice(1)}`
        log.info('device operation', { instanceID, tabID, device, operation })
        await tab[fn]()
        cb()
      })
    }
  }
})

server.listen(config.host.port, () => {
  log.info(`HTTP server listening on port ${config.host.port}`)
})
