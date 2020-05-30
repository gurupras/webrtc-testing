<template>
<AsyncOp v-bind="$attrs" v-on="$listeners">
  <b-button slot-scope="{ $attrs, loading, $listeners }" v-bind="$attrs" :loading="loading" class="button" v-on="$listeners">
    <slot></slot>
  </b-button>
</AsyncOp>
</template>

<script>
export default {
  name: 'async-button',
  components: {
    AsyncOp: () => import('./async-op')
  }
}
</script>
