import AsyncLock from 'async-lock'

class TaskQueue {
  constructor () {
    this.tasks = []
    this.lock = new AsyncLock()
  }

  add (task) {
    this.tasks.push(task)
    this.process()
  }

  async process () {
    const { lock, tasks } = this
    if (lock.isBusy('lock')) {
      return
    }
    await lock.acquire('lock', async () => {
      while (tasks.length > 0) {
        const task = tasks.shift()
        try {
          await task()
        } catch (e) {
          // console.error(e)
        }
      }
    })
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export default TaskQueue
