export default class Canvas {
    constructor() {
        this.frames = 0;
        this.lmt = 0;
        this.fps = 0;
        this.ctxBG = fftBG.getContext('2d', { antialias: false, alpha: false });
        this.ctxSpectrum = spectrum.getContext('2d', { alpha: false, antialias: false, willReadFrequently: true });
        this.ctxFft = fft.getContext('2d', { antialias: false });
        this.resize();
    }

    i2Hz(i) {
        return i * this.sampleRate / (this.freqData.length * 2)
    }

    start(audio) {
        this.d = [];
        this.dComp = [];
        this.freqData = audio.getFreqData();
        this.sampleRate = audio.getSampleRate();
        this.normalizeData = this.freqData.length > this.W ? this.averageData : this.interpolateData;
        this.onUpdateCallback = audio.updateFreqData;
        this.resize();
        this.draw();
    }

    stop() {
        cancelAnimationFrame(this.animationFrame);
    }

    resize = () => {
        this.W = fft.width = fftBG.width = spectrum.width = fft.parentElement.clientWidth;
        this.H = fftBG.height = fft.parentElement.clientHeight;

        this.fftH = fft.height = fftBG.height * 0.2
        this.spectrumH = spectrum.height = fftBG.height * 0.8 - 16

        spectrum.style.top = this.fftH + 16 + 'px'

        if (this.freqData) {
            this.scaleX = this.W / this.freqData.length;
        }
        this.fftScaleY = this.fftH / 256;
        this.ctxFft.strokeStyle = '#aff';

        if (this.freqData) this.drawBG();
    }

    draw() {
        this.animationFrame = requestAnimationFrame(this.draw.bind(this));
        this.onUpdateCallback();
        this.normalizeData();
        this.drawGraph();
        this.drawSpectrum();
    }

    averageData() {
        const data = this.freqData;
        const dLen = data.length;
        const W = this.W;
        const scaleX = this.scaleX;
        const d = this.d;

        for (let x = 0; x < W; ++x) {
            d[x] = 0;
        }

        for (let i = 0; i < dLen; ++i) {
            const xi = (i * scaleX) | 0;
            if (data[i] > d[xi]) d[xi] = data[i];
        }
    }

    interpolateData() {
        const data = this.freqData;
        const W = this.W;
        const d = this.d;
        const scaleX = this.scaleX;
        for (let x = 0; x < W; ++x) {
            d[x] = data[(x / scaleX) | 0];
        }
    }

    drawBG() {
        const F_GRAD = 1000;

        const ctx = this.ctxBG;
        let nextF = F_GRAD;

        ctx.clearRect(0, 0, this.W, this.H);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#eee';
        ctx.strokeStyle = '#444';

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(0, this.fftH);
        ctx.lineTo(this.W, this.fftH);
        ctx.stroke();

        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        for (let i = 0, x = 0; i < this.freqData.length, x < this.W; i++, x += this.scaleX) {
            let cf = this.i2Hz(i);
            if (cf >= nextF) {
                ctx.moveTo((x | 0) - 0.5, 0);
                ctx.lineTo((x | 0) - 0.5, this.fftH);
                ctx.fillText(nextF / 1000 + 'k', x, this.fftH + 4);
                nextF += F_GRAD;
            }
        }
        ctx.stroke();
    }

    drawGraph() {
        const ctx = this.ctxFft;
        const fftH = this.fftH;
        const data = this.d;
        const fftScaleY = this.fftScaleY;
        const W = this.W;

        if (this.dComp.length) {
            for (let i in data) {
                data[i] -= this.dComp[i];
                if (data[i] < 0) data[i] = 0;
            }
        }

        ctx.clearRect(0, 0, W, fftH);
        ctx.beginPath();
        ctx.moveTo(0, fftH);
        for (let x = 0; x < W; ++x) {
            ctx.lineTo(x + 0.5, ((fftH - data[x] * fftScaleY) | 0) + 0.5);
        }
        ctx.stroke();

        ctx.fillStyle = '#fff';

        this.frames++;
        if (performance.now() - this.lmt > 1000) {
            this.fps = this.frames * 1000 / (performance.now() - this.lmt);
            this.lmt = performance.now();
            this.frames = 0;
        }
        ctx.fillText(this.fps | 0, 0, 16);
    }

    drawSpectrum() {
        const ctx = this.ctxSpectrum;
        const data = this.d;
        const colors = this.colors;
        const W = this.W;

        ctx.save();
        ctx.translate(0, 1);
        ctx.drawImage(ctx.canvas, 0, 0);
        for (let x = 0; x < W; ++x) {
            const p = colors[data[x]];
            ctx.fillStyle = `rgb(${p})`;
            ctx.fillRect(x, 0, 1, 1);
        }
        ctx.restore();
    }

    setPalette(palette) {
        const gradient = this.ctxSpectrum.createLinearGradient(0, 0, 255, 0);
        const paletteSize = palette.length;
        palette.forEach((c, i) => {
            const cStop = i / paletteSize;
            gradient.addColorStop(cStop, c);
        });
        this.ctxSpectrum.fillStyle = gradient;
        this.ctxSpectrum.fillRect(0, 1, 256, 5);
        this.colors = [];
        for (let i = 0; i < 256; i++) {
            this.colors[i] = this.ctxSpectrum.getImageData(i, 1, 1, 1).data;
        }
    }

    calibrate = () => {
        if (this.dComp.length !== 0) {
            this.dComp.length = 0;
            return;
        }
        let mi = Math.min(...this.d);
        this.dComp = this.d.map(c => c - mi);
        const SZ = this.dComp.length;
        for (let i = 0; i < SZ; ++i) {
            let f = i > 0 ? i - 1 : 0;
            let t = i < SZ - 1 ? i + 1 : SZ - 1;
            let a = this.dComp.slice(f, t + 1);
            let s = a.reduce((sum, item) => sum += item, 0);
            let v = (s / a.length) | 0;
            console.log(f, t, a, s, v, mi);
            this.dComp[i] = v;
        }
    }
}
