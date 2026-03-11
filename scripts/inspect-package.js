const tts = require("@travisvn/edge-tts");
console.log("Package Exports:", Object.keys(tts));
if (tts.EdgeTTS) {
    console.log("EdgeTTS Prototype:", Object.keys(tts.EdgeTTS.prototype));
    const instance = new tts.EdgeTTS();
    console.log("Instance Keys:", Object.keys(instance));
}
