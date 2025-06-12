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

    remap(x, srcMin, srcMax, dstMin, dstMax) {
        if (srcMax === srcMin) return dstMin;
        x = Math.max(srcMin, Math.min(x, srcMax));
        return dstMin + ((x - srcMin) * (dstMax - dstMin)) / (srcMax - srcMin);
    }

    autorange = (cb) => {
        const { freqData, analyser } = this;

        analyser.minDecibels = -180;
        analyser.maxDecibels = 10;

        setTimeout(() => {
            let sumDev = 0;
            let maxValue = 0;

            for (let i = 0; i < freqData.length; ++i) {
                sumDev += Math.pow(freqData[i], 2);
                if (freqData[i] > maxValue) {
                    maxValue = freqData[i];
                }
            }
            const minValue = Math.sqrt(sumDev / freqData.length);

            const minDb = this.remap(minValue, 0, 255, analyser.minDecibels, analyser.maxDecibels);
            const maxDb = this.remap(maxValue, 0, 255, analyser.minDecibels, analyser.maxDecibels);

            analyser.minDecibels = minDb | 0;
            analyser.maxDecibels = maxDb | 0;

            if (analyser.maxDecibels - analyser.minDecibels < 20) {
                analyser.maxDecibels = analyser.minDecibels + 20;
            }
            cb();
        }, 100);
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
