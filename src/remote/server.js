const fs = require('fs')
const path = require('path')
const http = require('http')
const IO = require('socket.io')

const { Logger, globalLoggers, ConsoleLogger } = require('@gurupras/log')
const config = require('../../config')
const app = require('./api')

globalLoggers.push(new ConsoleLogger())
const log = new Logger('remote:server')

const server = http.createServer(app)

const io = new IO(server, {
  timeout: 120000
})

server.listen(config.remote.port, () => {
  log.info(`HTTP server listening on port ${config.remote.port}`)
})
