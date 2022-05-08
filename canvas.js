export default class Canvas {
  constructor(onUpdateCallback) {
    this.onUpdateCallback = onUpdateCallback;
    this.ctxBG = fftBG.getContext("2d", { antialias: false });
    this.ctxSpectrum = spectrum.getContext("2d");
    this.ctx = fft.getContext("2d");
    this.resize()
  }

  start(data, sampleRate) {
    this.data = data;
    this.sampleRate = sampleRate;
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

    if (this.data) {
      this.scaleX = this.W / this.data.length;
    }
    this.fftScaleY = this.fftH / 256;
    this.spectrumScaleY = this.spectrumH / 256;
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = '#05ffff';

    this.createColorGradient()

    this.drawBG();
  }

  draw() {
    this.animationFrame = requestAnimationFrame(this.draw.bind(this));
    this.onUpdateCallback();
    this.drawGraph();
    this.drawSpectrum();
  }

  drawBG() {
    const ctx = this.ctxBG;
    const pxpf = 2000 * this.W / this.sampleRate * 2;

    ctx.clearRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#eee';
    ctx.strokeStyle = '#888';

    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1, x = pxpf; x < this.W; k++, x += pxpf) {
      ctx.moveTo((x | 0) + 0.5, 0);
      ctx.lineTo((x | 0) + 0.5, this.fftH);
      ctx.fillText(k + "k", x, this.fftH + 4)
    }
    ctx.stroke();
  }

  drawGraph() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.fftH);
    ctx.beginPath();
    ctx.moveTo(0, this.fftH);
    for (let i = 0, x = 0; i < this.data.length, x < this.W; i++, x += this.scaleX) {
      ctx.lineTo(x, this.fftH - this.data[i] * this.fftScaleY);
    }
    ctx.stroke();
  }

  drawSpectrum() {
    const ctx = this.ctxSpectrum;

    const imageData = ctx.getImageData(0, 0, this.W, this.spectrumH);
    ctx.putImageData(imageData, 0, -1);

    for (let i = 0, x = 0; i < this.data.length, x < this.W; i++, x += this.scaleX) {
      ctx.fillStyle = this.colors[this.data[i]];
      ctx.fillRect(x, this.spectrumH - 1, 1, 1);
    }
  }

  createColorGradient() {
    const gradient = this.ctxSpectrum.createLinearGradient(0, 0, 0, 255);
    gradient.addColorStop(0, '#002');
    gradient.addColorStop(0.15, '#00f');
    gradient.addColorStop(0.35, '#fff');
    gradient.addColorStop(0.5, '#ff0');
    gradient.addColorStop(0.75, '#f00');
    gradient.addColorStop(1, '#800');
    this.ctxSpectrum.fillStyle = gradient;
    this.ctxSpectrum.fillRect(1, 0, 1, 255);
    const colors = [];
    for (let i = 0; i < 255; i++) {
      let p = this.ctxSpectrum.getImageData(1, i, 1, 1).data;
      colors[i] = `rgb(${p[0]},${p[1]},${p[2]})`;
    }
    this.colors = colors;
    this.ctxSpectrum.clearRect(0, 0, this.W, this.H);
  }
}
