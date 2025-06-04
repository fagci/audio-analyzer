export default class Audio {
    analyser;
    gain;
    osc;

    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive', // 'balanced' for power saving
            sampleRate: 48000,
        });
        this.gain = this.audioContext.createGain();
        this.analyser = this.audioContext.createAnalyser();
        this.osc = [];


        this.gain.connect(this.analyser);
        this.setFftSize(4096)

        // this.recreateOscillators();
    }

    recreateOscillator(i) {
        if (this.osc[i]) {
            this.osc[i].disconnect(this.audioContext.destination);
        }
        this.osc[i] = this.audioContext.createOscillator();
        this.osc[i].type = 'sine';
        this.osc[i].connect(this.audioContext.destination);
    }

    recreateOscillators() {
        for (let i = 0; i < 3; i++) {
            this.recreateOscillator(i)
        }
    }

    async start(deviceId) {
        const supported = navigator.mediaDevices.getSupportedConstraints();
        console.log(supported);
        const constraints = {
            audio: {
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false,
                sampleRate: 48000,
                channelCount: 1,
                ...(supported.voiceIsolation && { voiceIsolation: false }),
                ...(deviceId && { deviceId: { exact: deviceId } }),
            },
            video: false,
        };
        if (this.stream) {
            this.source.disconnect(this.gain);
            this.stream.getTracks().forEach((t) => t.stop());
            this.source = null;
            this.stream = null;
        }
        this.stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        this.source.connect(this.gain);

        // this.recreateOscillators();
    }

    getAnalyser() { return this.analyser; }
    getGain() { return this.gain; }
    getFreqData() { return this.freqData; }
    setOscF(n, f) {
        // this.osc[n].frequency.linearRampToValueAtTime(f, this.audioContext.currentTime + 1);
    }
    setOscState(n, on) {
        console.log(this.osc[n], on ? 'on' : 'off');
        if (on) {
            this.osc[n].start();
        } else {
            this.osc[n].stop();
            this.recreateOscillator(n);
        }
    }

    setFftSize(value) {
        this.analyser.fftSize = value;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    updateFreqData = () => {
        this.analyser.getByteFrequencyData(this.freqData);
    }
    getSampleRate() { return this.audioContext.sampleRate; }
}
