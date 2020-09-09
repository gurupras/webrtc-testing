<template>
  <div style="font-size: 0.7em;">
    <ul v-for="entry in processedStats" :key="entry.type + ':' + entry.kind">
      <li>
        [{{ entry.type }}-{{ entry.kind }}] - {{ entry.data }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'stats',
  props: ['stats'],
  watch: {
    stats (v) {
      this.processStats()
    }
  },
  data () {
    return {
      framesDecoded: 0,
      totalSamplesDuration: 0,
      lastTime: 0,
      processedStats: []
    }
  },
  methods: {
    processStats () {
      const result = []
      const { lastTime, framesDecoded } = this
      for (const entry of this.stats) {
        const { type, kind, stats } = entry
        const values = stats.map(x => x[1])
        const trackStats = values.find(x => x.type === 'track' && (x.kind === 'video' || x.kind === 'audio'))

        let data
        switch (kind) {
          case 'audio': {
            const { totalSamplesDuration } = trackStats
            data = { duration: totalSamplesDuration.toFixed(2) }
            break
          }
          case 'video': {
            const { framesDecoded: newFramesDecoded } = trackStats
            const now = Date.now()
            if (lastTime) {
              const fps = ((newFramesDecoded - framesDecoded) / ((now - lastTime) / 1000)) | 0
              data = { fps }
            }
            this.lastTime = now
            this.framesDecoded = newFramesDecoded
            break
          }
        }

        if (data) {
          result.push({
            type,
            kind,
            data
          })
        }
      }
      this.processedStats = result
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
