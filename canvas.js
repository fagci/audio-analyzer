export default class Canvas {
  constructor(onUpdateCallback) {
    this.onUpdateCallback = onUpdateCallback;
    this.ctxBG = fftBG.getContext("2d");
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
    this.H = fft.height = fftBG.height = spectrum.height = fft.parentElement.clientHeight;
    if (this.data) {
      this.scaleX = this.W / this.data.length;
    }
    this.scaleY = this.H / 256;
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#05ffff';

    const gradient = this.ctxSpectrum.createLinearGradient(0, 0, 0, 255);
    gradient.addColorStop(0, '#00f');
    gradient.addColorStop(0.5, '#ff0');
    gradient.addColorStop(1, '#f00');
    this.ctxSpectrum.fillStyle = gradient;
    this.ctxSpectrum.fillRect(1, 0, 1, 255);
    const colors = [];
    for (let i = 0; i < 255; i++) {
      let p = this.ctxSpectrum.getImageData(1, i, 1, 1).data;
      colors[i] = `rgb(${p[0]},${p[1]},${p[2]})`;
    }
    this.colors = colors;
    this.ctxSpectrum.clearRect(0, 0, this.W, this.H);

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
    const W = this.W;
    const H = this.H;
    const pxpf = 1000 * this.W / this.sampleRate * 2;

    ctx.clearRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#eee';
    ctx.strokeStyle = '#aaa';

    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1, x = pxpf; x < W; k++, x += pxpf) {
      ctx.moveTo(x, 4);
      ctx.lineTo(x, H - 16);
      ctx.fillText(k + "k", x, H - 12)
    }
    ctx.stroke();
  }

  drawGraph() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.beginPath();
    ctx.moveTo(0, this.H);
    for (let i = 0, x = 0; i < this.data.length, x < this.W; i++, x += this.scaleX) {
      ctx.lineTo(x, this.H - this.data[i] * this.scaleY);
    }
    ctx.stroke();
  }

  drawSpectrum() {
    const ctx = this.ctxSpectrum;

    const imageData = ctx.getImageData(0, 0, this.W, this.H);
    ctx.putImageData(imageData, 0, -1);

    for (let i = 0, x = 0; i < this.data.length, x < this.W; i++, x += this.scaleX) {
      ctx.fillStyle = this.colors[this.data[i]];
      ctx.fillRect(x, this.H - 1, 1, 1);
    }
  }
}
