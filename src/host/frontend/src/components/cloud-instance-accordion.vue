<template>
<b-collapse class="card" animation="slide" :open.sync="open">
  <div slot="trigger" slot-scope="props" class="card-header" role="button">
    <CloudInstance v-bind="attrs" v-on="$listeners" class="card-header-title has-text-weight-normal">
      <template slot="pre-info">
        <div class="column info card-header-icon" style="max-width: 64px;">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"/>
        </div>
      </template>
    </CloudInstance>
  </div>
  <div class="card-content" v-show="tabs.length > 0">
    <div class="content">
      <ul class="list">
        <li class="list-item">
          <div class="columns is-flex has-text-weight-bold">
            <div class="column info">Room</div>
            <div class="column info">Webcam</div>
            <div class="column info">Mic</div>
            <div class="column info"></div>
          </div>
        </li>
        <li class="list-item is-hoverable" v-for="(tab, index) in tabs" :key="tab.id">
          <CloudTab :instance-id="id" :id="tab.id" :room.sync="tab.room" :webcam.sync="tab.webcam" :mic.sync="tab.mic" @close-tab="tabs.splice(index, 1)"/>
        </li>
      </ul>
    </div>
  </div>
</b-collapse>
</template>

<script>
export default {
  name: 'cloud-instance-accordion',
  components: {
    CloudInstance: () => import('@/components/cloud-instance'),
    CloudTab: () => import('@/components/cloud-tab')
  },
  props: {
    id: {
      type: String,
      required: true
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
      const { id, tabs } = this
      return {
        ...this.$attrs,
        id,
        tabs
      }
    }
  },
  watch: {
    tabs () {
      this.open = true
    }
  },
  methods: {
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
