const { nanoid } = require('nanoid')

const MockCloudTab = require('./mock-cloud-tab')
const { randomSleep } = require('./utils')

class MockCloudInstance {
  constructor (ip, info) {
    Object.assign(this, {
      ...info,
      ip
    })
    this.tabsMap = {}
    this.tabs = []
  }

  async createTab () {
    const id = nanoid()
    const tab = new MockCloudTab(id)
    await randomSleep(1000)
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
    await randomSleep(1000)
    const { tabs, tabsMap } = this
    tabs.splice(tabs.findIndex(tab => tab.id === tabID), 1)
    delete tabsMap[tabID]
  }
}
module.exports = MockCloudInstance
