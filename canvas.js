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

        this.imageData = this.ctxSpectrum.getImageData(0, 0, this.W, this.spectrumH);

        spectrum.style.top = this.fftH + 16 + 'px'

        if (this.freqData) {
            this.scaleX = this.W / this.freqData.length;
        }
        this.fftScaleY = this.fftH / 256;
        this.ctxFft.strokeStyle = '#aff';

        if (this.freqData) this.drawBG();
    }

    findPeaks(N = 3, threshold = 10, minDist = 10) {
      // N — сколько пиков искать
      // threshold — минимальный уровень (отсекает шум)
      // minDist — минимальное расстояние между пиками (в пикселях)
      const data = this.d;
      const W = this.W;
      let peaks = [];

      for (let x = 1; x < W - 1; ++x) {
        if (data[x] > threshold && data[x] > data[x - 1] && data[x] > data[x + 1]) {
          peaks.push({ x, value: data[x] });
        }
      }

      // Сортируем по убыванию амплитуды
      peaks.sort((a, b) => b.value - a.value);

      // Оставляем только N пиков, разнесённых не ближе minDist друг от друга
      let filtered = [];
      for (let i = 0; i < peaks.length && filtered.length < N; ++i) {
        if (filtered.every(p => Math.abs(p.x - peaks[i].x) >= minDist)) {
          const freqBin = Math.round(peaks[i].x / W * this.freqData.length);
          const f = this.i2Hz(freqBin);
          filtered.push({ ...peaks[i], f });
        }
      }
      return filtered;
    }

    draw() {
        if (document.hidden) {
            this.stop();
            return;
        }
        
        // throttle FPS
        const targetFPS = document.hasFocus() ? 33 : 25;
        const now = performance.now();
        this.animationFrame = requestAnimationFrame(this.draw.bind(this));
        if (now - this.lastFrameTime < 1000/targetFPS) {
            return;
        }
        this.lastFrameTime = now;

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


        // Нарисовать несколько пиков
        const peaks = this.findPeaks(3, 10, 40);
        for (const peak of peaks) {
          let peakY = (this.fftH - peak.value * this.fftScaleY);
          if(peakY < 6) {
            peakY = 6;
          }
          ctx.save();
          ctx.fillStyle = '#ff0';
          ctx.beginPath();
          ctx.arc(peak.x + 0.5, peakY + 0.5, 3, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fill();

          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(peak.f.toFixed(0) + ' Hz', peak.x, 11);
          ctx.restore();
        }

        this.frames++;
        if (performance.now() - this.lmt > 1000) {
            this.fps = this.frames * 1000 / (performance.now() - this.lmt);
            this.lmt = performance.now();
            this.frames = 0;
        }
        ctx.fillText(this.fps | 0, 0, 16);
    }

    drawSpectrum() {
        if(!this.imageData) return;
        this.lastSpectrumUpdate = performance.now();


        const ctx = this.ctxSpectrum;
        const data = this.d;
        const colors = this.colors;
        const W = this.W;

        const pixels = this.imageData.data;
        const rowSize = W * 4;
        pixels.copyWithin(rowSize, 0, pixels.length - rowSize);

        for (let x = 0; x < W; ++x) {
            const [r,g,b,a] = colors[data[x]];
            const idx = x * 4;
            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255; // альфа
        }
        this.ctxSpectrum.putImageData(this.imageData, 0, 0);
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
        function movingAverage(data, windowSize) {
          const result = [];
          for (let i = 0; i < data.length; i++) {
            let start = Math.max(0, i - windowSize + 1);
            let window = data.slice(start, i + 1);
            result.push(average(window));
          }
          return result;
        }

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
        this.dComp = movingAverage(this.dComp, 16);
    }
}
