export default function patchSocketIO (socket) {
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
}
