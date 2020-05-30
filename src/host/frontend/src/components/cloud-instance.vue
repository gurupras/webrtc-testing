<template>
<div class="columns cloud-info-container">
  <slot name="pre-info"></slot>
  <div class="column info host-column">{{ host }}</div>
  <div class="column info num-tabs-column">{{ Object.keys(tabs).length }}</div>
  <div class="column info justify-end create-tab-column">
    <AsyncButton @click.stop="createTab" class="is-link">Create Tab</AsyncButton>
  </div>
  <div class="column info justify-end destroy-instance-column">
    <AsyncButton @click.stop="destroyInstance" icon-right="delete" class="is-danger is-pulled-right">Destroy Instance</AsyncButton>
  </div>
</div>
</template>

<script>
export default {
  name: 'cloud-instance',
  components: {
    AsyncButton: () => import('@/components/async-button')
  },
  props: {
    host: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    tabs: {
      type: Array,
      required: true
    }
  },
  methods: {
    async createTab () {
      const { id, tabs } = this
      const tab = await this.socket.signal('tab:create', { id })
      tabs.unshift(tab)
    },
    async destroyInstance () {
      const { id } = this
      await this.socket.signal('cloud-api:destroy', id)
      this.$emit('destroy-instance', { id })
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
