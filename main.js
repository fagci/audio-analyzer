const ctx = cv.getContext("2d");
const W = cv.width = cv.clientWidth;
const H = cv.height = cv.clientHeight;

let auCtx, analyser, gain, source;
let scaleX, scaleY, freqData;
let pxpf;
let binsCount;

let animationFrame;

const FREQ_STEP = 1000;

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

  animationFrame = requestAnimationFrame(draw);
}

function updateGain() {
  gain.gain.value = this.value;
}

window.addEventListener("load", async function() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const createOption = (d, i) =>
    `<option value="${d.deviceId}">${d.label ? d.label : 'Input ' + i}</option>`;
  src.innerHTML =
    "<option>Select device</option>" +
    devices
      .filter((d) => d.kind === "audioinput")
      .map(createOption)
      .join("");
});

src.addEventListener("change", async function(e) {
  if(animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  if (!auCtx) {
    auCtx = new AudioContext();
    gain = auCtx.createGain();
    analyser = auCtx.createAnalyser();

    analyser.fftSize = 1024;
    gain.gain.value = inputGain.value;

    binsCount = analyser.frequencyBinCount;

    scaleX = W / binsCount;
    scaleY = H / 256;
    freqData = new Uint8Array(binsCount);
    pxpf = FREQ_STEP * W / (freqData.length * auCtx.sampleRate / (binsCount * 2))

    inputGain.addEventListener('change', updateGain);
    inputGain.addEventListener('mousemove', updateGain);
    inputGain.addEventListener('touchmove', updateGain);
  }

  const constraints = {
    audio: { deviceId: {exact: src.value }},
    video: false
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  if (source) {
    source.disconnect(gain);
    const tracks = source.getTracks()
    tracks.forEach(track => {track.stop()})
    source.stop();
    source = undefined
  }

  source = auCtx.createMediaStreamSource(stream);
  source.connect(gain);
  gain.connect(analyser);
  draw();
});
