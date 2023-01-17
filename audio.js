export default class Audio {
    constructor(fftSize = 2048, gain = 1) {
        this.audioContext = new AudioContext();
        this.gain = this.audioContext.createGain();
        this.analyser = this.audioContext.createAnalyser();

        this.analyser.smoothingTimeConstant = 0;
        this.analyser.minDecibels = -140;
        this.analyser.maxDecibels = -30;

        this.gain.connect(this.analyser);
        this.setFftSize(fftSize)
        this.setGain(gain)
    }

    async start(deviceId) {
        const constraints = {
            audio: {
                deviceId,
            },
            video: false
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

    setGain(value) {
        this.gain.gain.value = value;
    }

    setFftSize(value) {
        this.analyser.fftSize = value;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    getFreqData() { return this.freqData; }
    updateFreqData = () => { this.analyser.getByteFrequencyData(this.freqData); }
    getSampleRate() { return this.audioContext.sampleRate; }
}
