import palettes from "./palettes.js"
import GUI from './lil-gui.js'

let audioContext;
let analyser, gain, source;
let stream;
let colors;
let freqData;
let data = new Uint8Array(window.innerWidth);

let animationFrame;

let settings = {
    palette: 'gqrx',
};

let devList = {};


const ctxFft = fft.getContext('2d', { alpha: false, antialias: false });
const ctxSpectrum = spectrum.getContext('2d', { alpha: false, antialias: false, willReadFrequently: true });
const UI = new GUI({ title: 'Settings', autoPlace: true });
const deviceListControl = UI.add({ device: 'Select device' }, 'device').name('Input');
const mediaDevices = navigator.mediaDevices;

const FFT_SIZES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];


function i2Hz(i) {
    return i * audioContext.sampleRate / (freqData.length * 2);
}

function init() {
    audioContext = new AudioContext();
    gain = audioContext.createGain();
    analyser = audioContext.createAnalyser();

    analyser.minDecibels = -135;
    analyser.maxDecibels = -40;
    analyser.smoothingTimeConstant = 0;
    analyser.fftSize = 4096;

    gain.connect(analyser);
}

function setPalette(palette) {
    const ocv = new OffscreenCanvas(256, 1);
    const oct = ocv.getContext('2d', { antialias: false, alpha: false, willReadFrequently: true });
    const gradient = oct.createLinearGradient(0, 0, 255, 0);
    palette.forEach((c, i) => {
        const cStop = i / palette.length;
        gradient.addColorStop(cStop, c);
    });
    oct.fillStyle = gradient;
    oct.fillRect(0, 0, 256, 1);
    colors = [];
    for (let i = 0; i < 256; i++) {
        colors.push(oct.getImageData(i, 0, 1, 1).data);
    }
}

function drawSpectrum() {
    ctxSpectrum.save();
    ctxSpectrum.translate(0, 1);
    ctxSpectrum.drawImage(spectrum, 0, 0);
    for (let x = 0; x < data.length; ++x) {
        const p = colors[data[x]];
        ctxSpectrum.fillStyle = `rgba(${p})`;
        ctxSpectrum.fillRect(x, 0, 1, 1);
    }
    ctxSpectrum.restore();
}


function drawBG() {
    const F_GRAD = 1000;

    const ctx = ctxFft;
    let nextF = F_GRAD;
    const W = fft.width;
    const H = fft.height;

    // ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#eee';
    ctx.strokeStyle = '#444';

    ctx.lineWidth = 1;
    const scaleX = data.length / freqData.length;

    ctx.beginPath();

    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.stroke();

    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    for (let i = 0, x = 0; i < freqData.length, x < W; i++, x += scaleX) {
        let cf = i2Hz(i);
        if (cf >= nextF) {
            ctx.moveTo((x | 0) - 0.5, 0);
            ctx.lineTo((x | 0) - 0.5, H);
            ctx.fillText(nextF / 1000 + 'k', x, H - 12);
            nextF += F_GRAD;
        }
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawGraph() {
    ctxFft.clearRect(0, 0, fft.width, fft.height);
    drawBG();


    const W = fft.width;
    const H = fft.height;
    const k = H / 256;

    ctxFft.strokeStyle = '#fff';
    ctxFft.beginPath();
    ctxFft.moveTo(0, H - data[0] * k);
    for (let x in data) {
        ctxFft.lineTo(x, H - data[x] * k);
    }
    ctxFft.stroke();
}

const ocv = new OffscreenCanvas(32768, 1);
const oct = ocv.getContext('2d', { antialias: false, alpha: false, willReadFrequently: true });
const id = oct.getImageData(0, 0, ocv.width, 1);
function zoom(center, size, input, output) {
    for (let i in input) {
        id.data[i * 4] = input[i];
    }
    oct.putImageData(id, 0, 0, 0, 0, input.length, 1);
    oct.drawImage(ocv, 0, 0, input.length, 1, 0, 0, output.length, 1);
    let to = oct.getImageData(0, 0, output.length, 1).data;
    for (let i in output) {
        output[i] = to[i * 4];
    }
}

function draw() {
    animationFrame = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(freqData);

    zoom(0, window.innerWidth, freqData, data);

    drawGraph();
    drawSpectrum();
}

async function start(deviceId) {
    const constraints = {
        audio: {
            deviceId: { exact: deviceId },
            latency: 0,
            sampleRate: 48000,
            channelCount: 1,
            voiceIsolation: false,
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
        },
        video: false,
    };
    if (stream) {
        source.disconnect(gain);
        stream.getTracks().forEach((t) => t.stop());
        source = stream = null;
    }
    stream = await mediaDevices.getUserMedia(constraints)
    source = audioContext.createMediaStreamSource(stream);
    source.connect(gain);
}


async function onDeviceSelect(deviceId) {
    cancelAnimationFrame(animationFrame);
    if (!audioContext) {
        init();
    }

    const audioSettings = UI.addFolder('Audio').close();
    const displaySettings = UI.addFolder('Display').close();

    audioSettings
        .add(analyser, 'fftSize', FFT_SIZES)
        .name('FFT bins')
        .onChange(onFftChange);

    audioSettings
        .add(gain.gain, 'value', 0, 46)
        .decimals(1)
        .name('gain');

    audioSettings
        .add(analyser, 'maxDecibels', -160, 120)
        .name('max dB');

    audioSettings
        .add(analyser, 'minDecibels', -160, 120)
        .name('min dB');

    audioSettings
        .add(analyser, 'smoothingTimeConstant', 0, 1, 0.1)
        .name('smoothing');

    displaySettings
        .add(settings, 'palette', Object.keys(palettes))
        .onChange(p => setPalette(palettes[p]));

    setPalette(palettes[settings.palette]);

    try {
        freqData = new Uint8Array(analyser.frequencyBinCount);
        // fft.width = spectrum.width = freqData.length;
        start(deviceId);
        draw();
    } catch (err) {
        alert(err.message)
        console.error(err)
    }
}

async function onFftChange(v) {
    cancelAnimationFrame(animationFrame);
    analyser.fftSize = v;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    // fft.width = spectrum.width = freqData.length;
    draw();
}

async function updateDevicesList() {
    devList = {};
    await mediaDevices.getUserMedia({ audio: true });
    const devices = (await mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput')

    devices.forEach((d, i) => {
        devList[d.label || `Input ${i}`] = d.deviceId;
    });

    // todo: fix doubling control
    deviceListControl.options(devList).onChange(onDeviceSelect);
}

function onResize() {
    fft.width = spectrum.width = window.innerWidth;
    fft.height = fft.clientHeight;
    spectrum.height = spectrum.clientHeight;
    data = new Uint8Array(window.innerWidth);
}

window.addEventListener('load', async function() {
    updateDevicesList();
    mediaDevices.addEventListener('devicechange', updateDevicesList);

    window.addEventListener('resize', onResize);
    onResize();

    try {
        await navigator.wakeLock.request('screen');
    } catch (_) { }
});
