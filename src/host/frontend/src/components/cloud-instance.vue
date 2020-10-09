<template>
<div class="columns cloud-info-container">
  <slot name="pre-info"></slot>
  <div class="column info resync-column">
    <AsyncButton class="button is-pulled-right is-success" icon-right="sync" @click="syncInstance">Re-sync</AsyncButton>
  </div>
  <div class="column info host-column">{{ host }}</div>
  <div class="column info num-tabs-column">{{ Object.keys(tabs).length }}</div>
  <div class="column info screenshot-column">
    <div class="field">
      <AsyncOp @input="checked => $emit('update:screenshots', checked)">
        <div slot-scope="{ loading, $listeners }">
          <b-switch :value="screenshots" :disabled="loading" v-on="$listeners" :class="{'is-loading loader': loading}"/>
        </div>
      </AsyncOp>
    </div>
  </div>
  <div class="column info justify-end create-tab-column">
    <AsyncButton @click.stop="createTab" :disabled="!ready" class="is-link">Create Tab</AsyncButton>
  </div>
  <div class="column info justify-end destroy-instance-column">
    <AsyncButton @click.stop="destroyInstance" :disabled="!ready" icon-right="delete" class="is-danger is-pulled-right">Destroy Instance</AsyncButton>
  </div>
</div>
</template>

<script>
export default {
  name: 'cloud-instance',
  components: {
    AsyncButton: () => import('@/components/async-button'),
    AsyncOp: () => import('@/components/async-op')
  },
  props: {
    host: {
      type: String,
      required: true
    },
    ready: {
      type: Boolean,
      default: false
    },
    id: {
      type: [String, Number],
      required: true
    },
    tabs: {
      type: Array,
      required: true
    },
    screenshots: {
      type: Boolean,
      required: true
    }
  },
  computed: {
  },
  methods: {
    async createTab () {
      const { id, tabs } = this
      const tab = await this.socket.signal('tab:create', { id })
      tabs.unshift(tab)
      return tab
    },
    async destroyInstance () {
      const { id } = this
      await this.socket.signal('cloud-api:destroy', id)
      this.$emit('destroy-instance', { id })
    },
    async syncInstance () {
      const { tabs, host, id } = this
      const instance = await this.socket.signal('instance:sync', { host, id })
      const { tabs: newTabs } = instance
      tabs.splice(0, tabs.length)
      tabs.push(...newTabs)
    }
  }
}
</script>

<style lang="scss" scoped>
.cloud-info-container > .info {
  display: flex;
  align-items: center;
}

ul.instance-tabs {
}

</style>
