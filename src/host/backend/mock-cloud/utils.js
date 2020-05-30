function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function randomSleep (max, min = 0) {
  const sleepDuration = (min + ((Math.random() * (max - min)) | 0))
  return sleep(sleepDuration)
}

function randomIP () {
  return (Math.floor(Math.random() * 255) + 1) + '.' + (Math.floor(Math.random() * 255)) + '.' + (Math.floor(Math.random() * 255)) + '.' + (Math.floor(Math.random() * 255))
}
module.exports = {
  sleep,
  randomSleep,
  randomIP
}
