export default class Canvas {
  constructor(onUpdateCallback) {
    this.onUpdateCallback = onUpdateCallback;
    this.ctxBG = fftBG.getContext("2d");
    this.ctx = fft.getContext("2d");
    this.resize()
  }

  start(data, sampleRate) {
    this.data = data;
    this.sampleRate = sampleRate;
    this.scaleX = this.W / data.length;
    this.scaleY = this.H / 256;
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#05ffff';
    this.drawBG();
    this.draw();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  resize() {
    this.W = fft.width = fftBG.width = fft.parentElement.clientWidth;
    this.H = fft.height = fftBG.height = fft.parentElement.clientHeight;
  }

  draw() {
    this.animationFrame = requestAnimationFrame(this.draw.bind(this));
    this.onUpdateCallback();
    this.drawGraph();
  }

  drawBG() {
    const ctx = this.ctxBG;
    const W = this.W;
    const H = this.H;
    const pxpf = 1000 * this.W / this.sampleRate * 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#eee';
    ctx.strokeStyle = '#aaa';

    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1, x = pxpf; x < W; k++, x += pxpf) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H - 16);
      ctx.fillText(k + "k", x, H - 12)
    }
    ctx.stroke();
  }

  drawGraph() {
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.H);
    for (let i = 0, x = 0; i < this.data.length, x < this.W; i++, x += this.scaleX) {
      this.ctx.lineTo(x, this.H - this.data[i] * this.scaleY);
    }
    this.ctx.stroke();
  }
}
