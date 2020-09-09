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
    cloudAPI = new LocalhostAPI(config)
    break
  case 'digitalocean':
    cloudAPI = new DigitalOceanCloudAPI(config)
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
        await isInstanceReady(instance)
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

const io = new IO(server, {
  timeout: 120000
})

async function isInstanceReady (instance) {
  await instance.discoverTabs()
  instance.ready = true
}
function checkIfInstanceIsReady (instance, socket) {
  // Wait until we can connect to this instance and then signal this to the client
  const fn = async () => {
    const { host, id } = instance
    try {
      log.debug('Checking if instance is ready ...', { host, id })
      await isInstanceReady(instance)
      log.debug('Instance ready', { host, id })
      socket.emit('cloud-api:ready', instance)
    } catch (e) {
      setTimeout(fn, 1000)
    }
  }
  setTimeout(fn, 1000)
}

io.on('connection', socket => {
  socket.on('cloud-api:list', async (_, cb) => {
    await retrievedInstancesDeferred
    cb(cloudAPI.instances)
  })

  socket.on('disconnect', () => {
    log.debug('Socket disconnected')
  })

  socket.on('cloud-api:create', async (_, cb) => {
    let result
    try {
      const instance = await cloudAPI.createInstance()
      result = instance
      checkIfInstanceIsReady(instance, socket)
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

  socket.on('cloud-api:add', async ({ host, id = nanoid() }, cb) => {
    const result = {}
    const instance = new CloudInstance(host, { id })
    try {
      // Make sure it works
      await isInstanceReady(instance)
      socket.emit('cloud-api:add', instance)
      log.info('Manually added instance', { host, id: instance.id })
      cloudAPI.addInstance(instance)
    } catch (e) {
      result.error = 'Host does not seem to have a remote running'
      log.error('Manually added instance does not have expected endpoints', { host })
    }
    cb(result)
  })

  socket.on('instance:sync', async ({ host, id }, cb) => {
    const { instanceMap: { [id]: oldInstance } } = cloudAPI
    const instance = new CloudInstance(host, { id })
    await isInstanceReady(instance)
    cloudAPI.removeInstance(oldInstance)
    cloudAPI.addInstance(instance)
    cb(instance)
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

  socket.on('tab:stats', async ({ instanceID, id: tabID }, cb) => {
    const { instanceMap: { [instanceID]: instance } } = cloudAPI
    const { tabsMap: { [tabID]: tab } } = instance
    const stats = await tab.getStats()
    cb(stats)
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
