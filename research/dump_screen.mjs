import { readScreen } from "../src/editor.mjs";
const s = readScreen();
console.log("shot:", s.shot, "| ok:", s.ok, "| words:", s.words.length);
console.log("TEXT:\n" + s.text.slice(0, 900));
