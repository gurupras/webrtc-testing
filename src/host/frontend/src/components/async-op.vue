<script>
export default {
  props: {
    busy: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      processing: false
    }
  },
  computed: {
    loading () {
      return this.busy || this.processing
    }
  },
  methods: {
    async performOperation (operation, ...args) {
      const { $listeners: { [operation]: listener } } = this
      if (!listener) {
        return
      }
      this.processing = true
      try {
        const result = listener(...args)
        if (result && result.toString() === '[object Promise]') {
          await result
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.processing = false
      }
    }
  },
  render () {
    const { $listeners, loading } = this
    const wrappedListeners = {}
    for (const evt of Object.keys($listeners)) {
      wrappedListeners[evt] = e => this.performOperation(evt, e)
    }
    return this.$scopedSlots.default({
      loading,
      $attrs: {
        ...this.$attrs,
        disabled: loading
      },
      $listeners: wrappedListeners
    })
  }
}
</script>
