const ctx = cv.getContext("2d");
const W = cv.width = cv.clientWidth;
const H = cv.height = cv.clientHeight;

let auCtx, analyser, gain, source;
let scaleX, scaleY, freqData;
let pxpf;
let binsCount;
let freqStep;

function updateGain() {
  gain.gain.value = this.value;
}

ig.addEventListener('change', updateGain);
ig.addEventListener('mousemove', updateGain);
ig.addEventListener('touchmove', updateGain);

ctx.textBaseline = 'top';

ctx.fillStyle = 'rgb(200, 200, 200)';

function draw() {
  analyser.getByteFrequencyData(freqData);

  ctx.clearRect(0, 0, W, H);

  ctx.textAlign = 'left';
  ctx.fillText('Gain:' + gain.gain.value, 8, 16)

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgb(64, 64, 64)';
  ctx.textAlign = 'middle';
  ctx.beginPath();
  for (let k = 1, x = pxpf; x < W; k++, x += pxpf) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H - 16);
    ctx.fillText(k + "k", x, H - 12)
  }
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgb(0, 200, 0)';
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let i = 0, x = 0; i < binsCount, x < W; i++, x += scaleX) {
    ctx.lineTo(x, H - freqData[i] * scaleY);
  }
  ctx.stroke();

  requestAnimationFrame(draw);
}

function handleSuccess(stream) {
  source = auCtx.createMediaStreamSource(stream);
  source.connect(gain);
  gain.connect(analyser);
  draw();
};

st.addEventListener('click', function() {
  auCtx = new AudioContext();
  gain = auCtx.createGain();
  analyser = auCtx.createAnalyser();

  analyser.fftSize = 1024;
  gain.gain.value = ig.value;

  binsCount = analyser.frequencyBinCount;

  freqStep = 1000;
  scaleX = W / binsCount;
  scaleY = H / 256;
  freqData = new Uint8Array(binsCount);
  pxpf = freqStep * W / (freqData.length * auCtx.sampleRate / (binsCount*2))

  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(handleSuccess);
})
