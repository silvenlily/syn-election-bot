export default class EventScheduler {
  tick: NodeJS.Timer;
  schedulerDelay: number;
  tasks: { [key: number]: { time: number; func: Function; args: any }[] };
  constructor(delay?: number) {
    this.schedulerDelay = delay ?? 600000;
    this.tick = setInterval(this.intervalHandler.bind(this), this.schedulerDelay);
    this.tasks = {};
  }
  async addTask(func: Function, time: number, args: any) {
    console.log(`adding task - time: ${time} - group ${Math.floor(time / this.schedulerDelay)}`);
    if (Date.now() > time) {
      func(args);
      return;
    }
    if (Date.now() + this.schedulerDelay + 1000 > time) {
      setTimeout(() => {
        func(args);
      }, Date.now() - time);
      return;
    }
    let taskGroup = Math.floor(time / this.schedulerDelay);
    if (this.tasks[taskGroup]) {
      this.tasks[taskGroup].push({ time: time, func: func, args: args });
    } else {
      this.tasks[taskGroup] = [{ time: time, func: func, args: args }];
    }
  }
  async intervalHandler() {
    let taskGroup = Math.floor(Date.now() / this.schedulerDelay);
    console.log(`schedular tick: ${taskGroup}`);
    let tasks = this.tasks[taskGroup];
    if (tasks) {
      for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i];
        let delay = task.time - Date.now();
        if (delay < 1) delay = 1;
        console.log(`executing task in: ${delay}`);
        setTimeout(() => {
          task.func(task.args);
        }, delay);
      }
      delete this.tasks[taskGroup];
    }
  }
}
