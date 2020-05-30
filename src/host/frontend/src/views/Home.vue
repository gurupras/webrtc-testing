<template>
<div class="section">
  <div class="container">
    <div class="columns">
      <div class="column">
        <AsyncOp @click="createInstance">
          <b-button slot-scope="{ $attrs, loading, $listeners }" v-bind="$attrs" :loading="loading" class="button is-pulled-right is-link" @click="$listeners.click">Create Instance</b-button>
        </AsyncOp>
      </div>
    </div>
    <div class="section" v-show="servers.length > 0">
      <div class="container">
        <div class="columns has-text-weight-bold" style="padding-left: 12px;">
          <div class="column" style="max-width: 64px;"></div>
          <div class="column">IP Address</div>
          <div class="column"># Tabs</div>
          <div class="column"></div>
          <div class="column"></div>
        </div>
        <CloudInstance v-for="(server, index) in servers" :key="server.ip"
            v-bind="server"
            :expand.sync="expanded[index]"
            @open="$set(expanded, index, true)"
            @close="$set(expanded, index, false)"
            @destroy-instance="destroyInstance"/>
      </div>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'home',
  components: {
    AsyncOp: () => import('@/components/async-op'),
    CloudInstance: () => import('@/components/cloud-instance-accordion')
  },
  data () {
    return {
      servers: [],
      expanded: { 0: true }
    }
  },
  methods: {
    onServerAdded (serverEntry) {
      const { servers, expanded } = this
      if (expanded[servers.length] === undefined) {
        this.$set(expanded, servers.length, false)
      }
      this.servers.push(serverEntry)
    },
    onServerRemoved ({ id }) {
      const { servers } = this
      const idx = servers.findIndex(x => x.id === id)
      if (idx === -1) {
        return
      }
      servers.splice(idx, 1)
    },
    onTabAdded (serverID, tab) {
      // FIXME: This is inefficient
      const server = this.servers.find(x => x.id === serverID)
      const { id: tabID } = tab
      server.tabs[tabID] = tab
    },
    onTabRemoved (server, { id }) {
      delete server.tabs[id]
    },
    async createInstance () {
      const instance = await this.socket.signal('cloud-api:create')
      this.onServerAdded(instance)
    },
    async destroyInstance ({ id }) {
      this.onServerRemoved({ id })
    }
  },
  async beforeMount () {
    const instances = await this.socket.signal('cloud-api:list')
    this.servers.push(...instances)
  }
}
</script>
<style lang="scss" scoped>
</style>
