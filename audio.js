export default class Audio {
    constructor(fftSize = 4096, gain = 1) {
        this.audioContext = new AudioContext();
        this.gain = this.audioContext.createGain();
        this.analyser = this.audioContext.createAnalyser();

        this.analyser.smoothingTimeConstant = 0;
        this.analyser.minDecibels = -130;
        this.analyser.maxDecibels = -20;

        this.gain.connect(this.analyser);
        this.setFftSize(fftSize)
        this.setGain(gain)
    }

    async start(deviceId) {
        const constraints = {
            audio: {
                sampleRate: 48000,
                channelCount: 1,
                // volume: 1.0,
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false,
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

    setMinDecibels(value) {
        this.analyser.minDecibels = value;
    }

    setMaxDecibels(value) {
        this.analyser.maxDecibels = value;
    }

    setFftSize(value) {
        this.analyser.fftSize = value;
        const bufferLength = this.analyser.frequencyBinCount;
        this.freqData = new Uint8Array(bufferLength);
    }

    getAnalyser() { return this.analyser; }
    getGain() { return this.gain; }

    getFreqData() { return this.freqData; }
    getTimeDomainData() { return this.dataArray; }
    updateFreqData = () => { 
        this.analyser.getByteFrequencyData(this.freqData);
    }
    getSampleRate() { return this.audioContext.sampleRate; }
}
