const fs = require('fs')
const path = require('path')
const http = require('http')
const IO = require('socket.io')

const { Logger, globalLoggers, ConsoleLogger } = require('@gurupras/log')
const config = require('../../config')
const { app, tabs } = require('./api')

globalLoggers.push(new ConsoleLogger())
const log = new Logger('remote:server')

const server = http.createServer(app)

const io = new IO(server, {
  timeout: 120000
})

io.on('connection', socket => {
  socket.on('screenshot', async ({ tabID, options }, cb) => {
    const { [tabID]: tab } = tabs
    if (!tab) {
      return cb({ error: 'No such tab' })
    }
    const screenshot = await tab.screenshot(options)
    cb(screenshot)
  })
})

server.listen(config.remote.port, () => {
  log.info(`HTTP server listening on port ${config.remote.port}`)
})
