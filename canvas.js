export default class Canvas {
    constructor() {
        this.ctxBG = fftBG.getContext("2d");
        this.ctxSpectrum = spectrum.getContext("2d", { alpha: false, willReadFrequently: true });
        this.ctxFft = fft.getContext("2d");
        this.resize()
    }

    i2Hz(i) {
        return i * this.sampleRate / (this.freqData.length * 2)
    }

    start(audio) {
        this.d = [];
        this.freqData = audio.getFreqData();
        this.sampleRate = audio.getSampleRate();
        this.normalizeData = this.freqData.length > this.W ? this.averageData : this.interpolateData;
        this.onUpdateCallback = audio.updateFreqData;
        this.resize()
        this.draw();
    }

    stop() {
        cancelAnimationFrame(this.animationFrame);
    }

    resize() {
        this.W = fft.width = fftBG.width = spectrum.width = fft.parentElement.clientWidth;
        this.H = fftBG.height = fft.parentElement.clientHeight;

        this.fftH = fft.height = fftBG.height * 0.2
        this.spectrumH = spectrum.height = fftBG.height * 0.8 - 16

        spectrum.style.top = this.fftH + 16 + "px"

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

        const c = [];
        for (let x = 0; x < W; ++x) {
            d[x] = 0;
            c[x] = 0;
        }

        for (let i = 0; i < dLen; ++i) {
            const xi = (i * scaleX) | 0;
            d[xi] += data[i];
            c[xi]++;
        }

        for (let x = 0; x < W; ++x) {
            d[x] = (d[x] / c[x]) | 0;
        }
    }

    interpolateData() {
        const data = this.data;
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
                ctx.fillText(nextF / 1000 + "k", x, this.fftH + 4);
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

        ctx.clearRect(0, 0, W, fftH);
        ctx.beginPath();
        ctx.moveTo(0, fftH);
        for (let x = 0; x < W; ++x) {
            ctx.lineTo(x + 0.5, ((fftH - data[x] * fftScaleY) | 0) + 0.5);
        }
        ctx.stroke();
    }

    drawSpectrum() {
        const ctx = this.ctxSpectrum;
        const spectrumH = this.spectrumH;
        const data = this.d;
        const colors = this.colors;
        const W = this.W;

        let imageData = ctx.getImageData(0, 0, W, spectrumH);
        ctx.putImageData(imageData, 0, 1);
        imageData = ctx.getImageData(0, spectrumH - 1, W, 1);

        for (let x = 0; x < W; ++x) {
            let ind = x * 4;
            const p = colors[data[x]];
            imageData.data[ind] = p[0];
            imageData.data[ind + 1] = p[1];
            imageData.data[ind + 2] = p[2];
        }
        ctx.putImageData(imageData, 0, 0);
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
}
