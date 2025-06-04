export default class Audio {
    analyser;
    gain;

    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive', // 'balanced' for power saving
            sampleRate: 48000,
        });
        this.gain = this.audioContext.createGain();
        this.analyser = this.audioContext.createAnalyser();

        this.gain.connect(this.analyser);
        this.setFftSize(4096)
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
    }

    getAnalyser() { return this.analyser; }
    getGain() { return this.gain; }
    getFreqData() { return this.freqData; }

    setFftSize(value) {
        this.analyser.fftSize = value;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    updateFreqData = () => {
        this.analyser.getByteFrequencyData(this.freqData);
    }
    getSampleRate() { return this.audioContext.sampleRate; }
}
