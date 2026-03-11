import { synthesizeSpeech } from '../../lib/tts-server';
synthesizeSpeech("Testing the python edge tts engine").then(buf => {
    console.log("Success, buffer length:", buf.length);
}).catch(e => {
    console.error("Failed:", e);
});
