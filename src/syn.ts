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
//let ps2 = child.fork(`./${env}/planetside/eventsTracker`);

shard.on("exit", (code) => {
  console.log(`discord shard exit with code: ${code}`);
  if (code && code != 0) {
    //ps2.kill();
    process.exit(code);
  }
});

//ps2.on("exit", (code) => {
//  console.log(`ps2 exit with code: ${code}`);
//  if (code && code != 0) {
//    shard.kill();
//    process.exit(code);
//  }
//});
