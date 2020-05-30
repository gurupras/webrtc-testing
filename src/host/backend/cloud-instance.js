const deepmerge = require('deepmerge')
const axios = require('axios')
const CloudTab = require('./cloud-tab')

const { Logger } = require('@gurupras/log')
const log = new Logger('cloud-instance')

class CloudInstance {
  constructor (host, info) {
    Object.assign(this, {
      ...info,
      host,
      baseURL: `http://${host}`
    })
    this.client = axios.create({
      baseURL: this.baseURL
    })
    this.tabsMap = {}
    this.tabs = []
  }

  async createTab () {
    const { client, baseURL } = this
    const response = await client.post('/tab/create')
    const { data: id } = response
    const tab = new CloudTab(id, baseURL)
    this.tabsMap[id] = tab
    this.tabs.unshift(tab)
    return tab
  }

  async closeTab (tab) {
    let tabID
    if (typeof tab === 'string') {
      tabID = tab
    } else {
      tabID = tab.id
    }
    if (!tabID) {
      throw new Error('Must specify at least a tab ID to destroy')
    }
    const { client, tabs, tabsMap } = this
    await client.delete(`/tab/${tabID}/close`)
    tabs.splice(tabs.findIndex(x => x.id === tabID), 1)
    delete tabsMap[tabID]
  }

  async discoverTabs (opts) {
    const { client, host } = this
    if (!opts) {
      opts = {}
    }
    const defaultOpts = { timeout: 5000 }
    const finalOpts = deepmerge(defaultOpts, opts)
    try {
      const response = await client.get('/tabs', finalOpts)
      const { data: tabs } = response
      for (const [id, tabData] of Object.entries(tabs)) {
        const tab = new CloudTab(id, `http://${host}`, tabData)
        this.tabs.push(tab)
        this.tabsMap[id] = tab
      }
    } catch (e) {
      log.error('Failed to get tabs for host', { host })
    }
  }
}

module.exports = CloudInstance
