import validateConfig from "./utils/validateConfig";
let settings = validateConfig();

import child from "child_process";

if (settings.devMode) {
  var env = "src";
  console.log("Starting syn ai in dev mode");
} else {
  var env = "build";
  console.log("Starting syn ai");
}

let shard = child.fork(`./${env}/discord/shard`);
let ps2 = child.fork(`./${env}/planetside/eventsTracker`);

shard.on("exit", (code) => {
  if (code && code != 0) {
    ps2.kill();
    process.kill(code);
  }
});

ps2.on("exit", (code) => {
  if (code && code != 0) {
    shard.kill();
    process.kill(code);
  }
});
