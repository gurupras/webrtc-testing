<script>
export default {
  props: {
  },
  data () {
    return {
      loading: false
    }
  },
  methods: {
    async performOperation (operation, ...args) {
      const { $listeners: { [operation]: listener } } = this
      if (!listener) {
        return
      }
      this.loading = true
      try {
        const result = listener(...args)
        if (result && result.toString() === '[object Promise]') {
          await result
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    }
  },
  render () {
    const { $listeners } = this
    const wrappedListeners = {}
    for (const evt of Object.keys($listeners)) {
      wrappedListeners[evt] = e => this.performOperation(evt, e)
    }
    return this.$scopedSlots.default({
      loading: this.loading,
      $attrs: {
        ...this.$attrs,
        disabled: this.loading
      },
      $listeners: wrappedListeners
    })
  }
}
</script>
