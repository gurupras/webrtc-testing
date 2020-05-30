const axios = require('axios')
const CloudTab = require('./cloud-tab')

class CloudInstance {
  constructor (host, info) {
    Object.assign(this, {
      ...info,
      host,
      baseURL: `http://${host}`
    })
    this.axios = axios.create({
      baseURL: this.baseURL
    })
    this.tabsMap = {}
    this.tabs = []
  }

  async createTab () {
    const { axios, baseURL } = this
    const response = await axios.post('/tab/create')
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
    const { axios, tabs, tabsMap } = this
    await axios.delete(`/tab/${tabID}/close`)
    tabs.splice(tabs.findIndex(x => x.id === tabID), 1)
    delete tabsMap[tabID]
  }
}
module.exports = CloudInstance
