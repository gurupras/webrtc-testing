const deepmerge = require('deepmerge')
const config = require('../../../config')

const { host: { proxyPath, devServer: devServerConfig } } = config

const devServerDefaults = {
  host: '0.0.0.0',
  port: 8080,
  disableHostCheck: true,
  proxy: {
    '/static/': {
      target: proxyPath
    },
    '/api/': {
      target: proxyPath
    },
    '/socket.io': {
      target: proxyPath,
      ws: true
    },
    '/favicon.ico': {
      target: proxyPath
    },
    '/coverage/': {
      target: proxyPath
    }
  }
}

const devServer = deepmerge(devServerDefaults, devServerConfig)
module.exports = {
  devServer
}
