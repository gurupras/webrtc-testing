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

export default {
  name: 'app',
  mounted () {
    const socket = io()
    socket.signal = (evt, args) => {
      return new Promise((resolve, reject) => {
        socket.emit(evt, args, (result = {}) => {
          if (result.error) {
            return reject(new Error(result.error))
          }
          resolve(result)
        })
      })
    }
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
