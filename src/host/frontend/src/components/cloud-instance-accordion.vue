<template>
<b-collapse class="card" animation="slide" :open.sync="open">
  <div slot="trigger" slot-scope="props" class="card-header" role="button">
    <CloudInstance v-bind="attrs" :screenshots.sync="screenshots" v-on="$listeners" class="card-header-title has-text-weight-normal" ref="instance">
      <template slot="pre-info">
        <div class="column info card-header-icon" style="max-width: 64px;">
          <div v-if="!ready" class="loader is-loading"/>
          <b-icon v-else :icon="props.open ? 'menu-down' : 'menu-up'"/>
        </div>
      </template>
    </CloudInstance>
  </div>
  <div class="card-content" v-show="tabs.length > 0">
    <div class="content">
      <ul class="list">
        <li class="list-item">
          <div class="columns is-flex has-text-weight-bold">
            <div class="column info" style="flex-grow: 1.2">Room</div>
            <div class="column info" style="flex-grow: 0.5"></div>
            <div class="column info" style="flex-grow: 0.5"></div>
            <div class="column info">Webcam</div>
            <div class="column info">Mic</div>
            <div class="column info" style="flex-grow: 2">Stats</div>
            <div class="column info" style="flex-grow: 2">Screenshot</div>
            <div class="column info"></div>
          </div>
        </li>
        <li class="list-item is-hoverable" v-for="(tab, index) in tabs" :key="tab.id">
          <CloudTab
              :instance-id="id"
              :id="tab.id"
              :host="host"
              :room.sync="tab.room"
              :instance-socket="instanceSocket"
              :webcam.sync="tab.webcam"
              :loading="tab.loading"
              :mic.sync="tab.mic"
              :screenshots="screenshots"
              @close-tab="tabs.splice(index, 1)"
              @task="onTask"
              ref="tabs"
              @clone-tab="cloneTab(tab)"/>
        </li>
      </ul>
    </div>
  </div>
</b-collapse>
</template>

<script>
import io from 'socket.io-client'
import patchSocketIO from '@/js/patch-socket.io'
import TaskQueue from '@/js/task-queue'

export default {
  name: 'cloud-instance-accordion',
  components: {
    CloudInstance: () => import('@/components/cloud-instance'),
    CloudTab: () => import('@/components/cloud-tab')
  },
  props: {
    id: {
      type: [String, Number],
      required: true
    },
    ready: {
      type: Boolean,
      default: false
    },
    expand: {
      type: Boolean,
      required: true
    },
    tabs: {
      type: Array,
      required: true
    }
  },
  computed: {
    open: {
      get () {
        return this.expand
      },
      set (v) {
        this.$emit('update:expand', v)
      }
    },
    attrs () {
      const { id, ready, tabs } = this
      return {
        ...this.$attrs,
        id,
        ready,
        tabs
      }
    },
    host () {
      return this.$attrs.host
    }
  },
  watch: {
    tabs () {
      this.open = true
    }
  },
  data () {
    return {
      instanceSocket: undefined,
      screenshots: false,
      taskQueue: new TaskQueue()
    }
  },
  methods: {
    async cloneTab (tab) {
      const { $refs: { instance } } = this
      const newTab = await instance.createTab()
      this.$set(newTab, 'loading', true)
      await this.$nextTick()
      const newTabComponent = this.$refs.tabs.find(ref => ref.id === newTab.id)
      await newTabComponent.joinRoom(tab.room)
      if (tab.webcam) {
        await newTabComponent.toggleDevice('webcam', tab.webcam)
      }
      if (tab.mic) {
        await newTabComponent.toggleDevice('mic', tab.mic)
      }
      newTab.loading = false
    },
    async onTask (data) {
      const { taskQueue } = this
      const { cb } = data
      taskQueue.add(cb)
    }
  },
  mounted () {
    const socket = io(`ws://${this.host}`, {
      transports: ['websocket']
    })
    patchSocketIO(socket)
    this.instanceSocket = socket
  }
}
</script>

<style lang="scss" scoped>
.cloud-info-container > .info {
  display: flex;
  align-items: center;
  &.info-btn {
    justify-content: flex-end;
  }
}

ul.instance-tabs {
}

</style>
