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
        try {
            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

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

        } catch (error) {
            console.error('Audio initialization failed:', error);
            throw new Error(`Microphone access denied: ${error.message}`);
        }
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.source) {
            this.source.disconnect();
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }

    getAnalyser() { return this.analyser; }
    getGain() { return this.gain; }
    getFreqData() { return this.freqData; }
    setOscF(n, f) {
        // this.osc[n].frequency.linearRampToValueAtTime(f, this.audioContext.currentTime + 1);
    }
    setOscState(n, on) {
        if (!this.osc[n]) return;

        if (on && this.osc[n].started !== true) {
            this.osc[n].start();
            this.osc[n].started = true;
        } else if (!on && this.osc[n].started === true) {
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
