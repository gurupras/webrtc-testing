<template>
  <div id="app" class="full-flex">
    <div id="nav">
      <router-link to="/">Home</router-link>
    </div>
    <router-view class=""/>
  </div>
</template>

<script>
import Vue from 'vue'
import io from 'socket.io-client'
import patchSocketIO from '@/js/patch-socket.io'

export default {
  name: 'app',
  mounted () {
    const socket = io()
    patchSocketIO(socket)
    Vue.prototype.socket = socket
    this.$store.commit('socket', socket)
  }
}
</script>
<style lang="scss">
html {
  overflow-y: hidden;
}

.full-flex, html, body {
  display: flex;
  flex-direction: column;
  flex: 1;
}

html, body {
  height: 100%;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

.justify-end {
  justify-content: flex-end;
}
</style>
