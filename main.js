import palettes from "./palettes.js"
import Canvas from './canvas.js'
import Audio from './audio.js'
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm'

let audio;

let canvas;
const gui = new GUI({ title: 'Settings', autoPlace: true });

async function onDeviceSelect(deviceId) {
    canvas.stop();

    if (!audio) {
        audio = new Audio(4096, 1);
        const an = audio.getAnalyser();
        const fftSizes = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
        const audioSettings = gui.addFolder('Audio').close();
        const displaySettings = gui.addFolder('Display').close();
        audioSettings.add(an, 'minDecibels', -200, 100).name('min dB');
        audioSettings.add(an, 'maxDecibels', -200, 100).name('max dB');
        audioSettings.add(an, 'smoothingTimeConstant', 0, 1, 0.01).name('smoothing');
        audioSettings.add(audio.getGain().gain, 'value', 0, 50, 0.5).name('gain');
        audioSettings.add({ fftSize: 4096 }, 'fftSize', fftSizes).name('FFT bins').onChange(v => {
            canvas.stop();
            audio.setFftSize(v);
            canvas.start(audio);
        });
        displaySettings.add({ palette: '' }, 'palette', Object.keys(palettes)).onChange(theme => {
            canvas.setPalette(palettes[theme]);
        }).setValue('gqrx')
    }

    try {
        audio.start(deviceId);
        canvas.start(audio);
    } catch (err) {
        alert(err.message)
        console.error(err)
    }
}

async function getMediaDevices(type) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === type)
}

async function updateDevicesList() {
    const devices = await getMediaDevices('audioinput');
    const devList = {};
    devices.forEach((d, i) => {
        console.log(d);
        devList[d.label || `Input ${i}`] = d.deviceId;
    });
    gui.add({ device: 'Select device' }, 'device', devList).name('Input').onChange(onDeviceSelect)
}

async function onPageLoad() {
    canvas = new Canvas();
    updateDevicesList();
    navigator.mediaDevices.addEventListener('devicechange', updateDevicesList);
    window.addEventListener("resize", canvas.resize.bind(canvas));


    try {
        await navigator.wakeLock.request('screen');
    } catch (_) { }
}

window.addEventListener("load", onPageLoad);
