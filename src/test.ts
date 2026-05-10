import { TMScriptConnection } from "./network/tm-script-connection.js"

const robot = new TMScriptConnection('192.168.1.2');
await robot.connect();
await robot.blend();
robot.disconnect();