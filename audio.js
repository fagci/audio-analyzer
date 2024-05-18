export default class Audio {
    analyser;
    gain;

    constructor() {
        this.audioContext = new AudioContext();
        this.gain = this.audioContext.createGain();
        this.analyser = this.audioContext.createAnalyser();

        this.gain.connect(this.analyser);
        this.setFftSize(4096)
    }

    async start(deviceId) {
        const constraints = {
            audio: {
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false,
                highpassFilter: false,
                lowpassFilter: false,
                sampleRate: 48000,
                channelCount: 1,
                deviceId,
            },
            video: false,
        };
        if (this.stream) {
            this.stream.getTracks().forEach((t) => t.stop());
            this.source.disconnect(this.gain);
            this.source = undefined;
            this.stream = undefined;
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
