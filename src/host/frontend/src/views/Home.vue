<template>
<div class="section">
  <div class="container">
    <div class="columns">
      <div class="column">
        <AsyncOp @click="createInstance">
          <b-button slot-scope="{ $attrs, loading, $listeners }" v-bind="$attrs" :loading="loading" class="button is-pulled-right is-link" @click="$listeners.click" style="margin: 0 2em;">Create Instance</b-button>
        </AsyncOp>
        <b-button class="button is-pulled-right is-link" @click="manual.showModal = true">Manually Add Instance</b-button>
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

  <b-modal :active.sync="manual.showModal">
    <div class="moda-card full-flex">
      <header class="modal-card-head">
        <p class="modal-card-title">Manually Add Instance</p>
      </header>
      <form action="">
        <section class="modal-card-body">
          <b-field label="ID">
            <b-input type="text" v-model.trim="manual.id" placeholder="Instance ID"/>
          </b-field>
          <b-field label="Host Address" :message="manual.error" :type="{'is-danger': manual.error}">
            <b-input type="text" v-model.trim="manual.host" placeholder="Instance host address" required/>
          </b-field>
        </section>
        <footer class="modal-card-foot">
          <b-button class="button" @click="manual.showModal = false">Close</b-button>
          <AsyncButton class="button is-primary" @click="addManualInstance">Add</AsyncButton>
        </footer>
      </form>
    </div>
  </b-modal>
</div>
</template>

<script>
export default {
  name: 'home',
  components: {
    AsyncOp: () => import('@/components/async-op'),
    AsyncButton: () => import('@/components/async-button'),
    CloudInstance: () => import('@/components/cloud-instance-accordion')
  },
  data () {
    return {
      servers: [],
      expanded: { 0: true },
      manual: {
        showModal: false,
        id: '',
        host: '',
        error: ''
      }
    }
  },
  watch: {
    'manual.host' () {
      this.manual.error = ''
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
    async addManualInstance () {
      const { manual } = this
      manual.error = ''
      try {
        let { host, id } = manual
        if (!id) {
          const { nanoid } = await import('nanoid')
          id = nanoid()
        }
        await this.socket.signal('cloud-api:add', { host, id })
        manual.showModal = false
      } catch (e) {
        manual.error = e.message
      }
    },
    async destroyInstance ({ id }) {
      this.onServerRemoved({ id })
    }
  },
  async beforeMount () {
    this.socket.on('cloud-api:add', instance => {
      this.servers.push(instance)
    })
    this.socket.on('cloud-api:ready', ({ id }) => {
      const instance = this.servers.find(x => `${x.id}` === `${id}`)
      this.$set(instance, 'ready', true)
    })
    const instances = await this.socket.signal('cloud-api:list')
    this.servers.push(...instances)
  }
}
</script>
<style lang="scss" scoped>
</style>
