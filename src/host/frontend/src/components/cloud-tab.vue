<template>
<div class="columns">
  <div class="column is-flex">
    <b-field style="flex: 0.75">
      <AsyncOp @process="joinRoom(roomName)" :busy="loading">
        <div slot-scope="{ loading, $listeners }">
          <b-input v-if="!room" v-model.trim="roomName" :disabled="loading" :loading="loading" @keyup.enter.native="$listeners.process"></b-input>
          <b-button v-else disabled>{{ room }}</b-button>
        </div>
      </AsyncOp>
    </b-field>
  </div>
  <div class="column" style="margin-left: -32px;">
    <a class="button" v-show="!loading" @click="$emit('clone-tab')">
      <b-icon icon="content-copy"/>
    </a>
  </div>
  <div class="column">
    <div class="field">
      <AsyncOp @input="toggleWebcam">
        <div slot-scope="{ loading, $listeners }">
          <!-- <div v-if="loading" class="loader is-loading"></div> -->
          <b-switch :value="webcam" :disabled="loading || !room" v-on="$listeners" :class="{'is-loading loader': loading}"/>
        </div>
      </AsyncOp>
    </div>
  </div>
  <div class="column">
    <div class="field">
      <AsyncOp @input="toggleMic">
        <div slot-scope="{ loading, $listeners }">
          <!-- <div v-if="loading" class="loader is-loading"></div> -->
          <b-switch :value="mic" :disabled="loading || !room" v-on="$listeners" :class="{'is-loading loader': loading}"/>
        </div>
      </AsyncOp>
    </div>
  </div>
  <div class="column justify-end close-tab-column">
    <AsyncButton @click="closeTab" icon-right="delete" class="is-danger is-pulled-right">Close Tab</AsyncButton>
  </div>
</div>
</template>

<script>
export default {
  name: 'cloud-tab',
  components: {
    AsyncOp: () => import('@/components/async-op'),
    AsyncButton: () => import('@/components/async-button')
  },
  props: {
    instanceId: {
      type: [String, Number],
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      required: true
    },
    room: {
      type: String,
      default: ''
    },
    webcam: {
      type: Boolean,
      default: false
    },
    mic: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      roomName: ''
    }
  },
  methods: {
    async closeTab () {
      const { instanceId: instanceID, id } = this
      await this.socket.signal('tab:close', { instanceID, id })
      this.$emit('close-tab', { instanceID, id })
    },
    // Value is expected to be flipped already
    async toggleDevice (device, value) {
      const { instanceId: instanceID, id } = this
      const evt = `${device}:${value ? 'start' : 'stop'}`
      await this.socket.signal(evt, { instanceID, id })
      // Update state
      this.$emit(`update:${device}`, value)
    },
    async toggleWebcam (e) {
      return this.toggleDevice('webcam', !this.webcam)
    },
    async toggleMic (e) {
      return this.toggleDevice('mic', !this.mic)
    },
    async joinRoom (roomName) {
      const { instanceId: instanceID, id } = this
      await this.socket.signal('tab:join', { instanceID, id, roomName })
      this.$emit('update:room', roomName)
    }
  }
}
</script>
