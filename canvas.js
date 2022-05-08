export default class Canvas {
  constructor() {
    this.ctxBG = fftBG.getContext("2d");
    this.ctx = fft.getContext("2d");
    this.resize()
  }

  start(data, sampleRate) {
    this.data = data;
    this.sampleRate = sampleRate;
    this.scaleX = this.W / data.length;
    this.scaleY = this.H / 256;
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
    this.drawGraph();
    this.animationFrame = requestAnimationFrame(this.draw.bind(this));
  }

  drawBG() {
    const ctx = this.ctxBG;
    const W = this.W;
    const H = this.H;
    const pxpf = 1000 * this.W / this.sampleRate * 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.strokeStyle = 'rgb(64, 64, 64)';

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
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgb(0, 200, 0)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.H);
    for (let i = 0, x = 0; i < this.data.length, x < this.W; i++, x += this.scaleX) {
      this.ctx.lineTo(x, this.H - this.data[i] * this.scaleY);
    }
    this.ctx.stroke();
  }
}
