import palettes from "./palettes.js"
import Canvas from './canvas.js'
import Audio from './audio.js'
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm'

let audio;
const canvas = new Canvas();
const gui = new GUI({ title: 'Settings', autoPlace: true });
const deviceListControl = gui.add({ device: 'Select device' }, 'device').name('Input');
const mediaDevices = navigator.mediaDevices;

const FFT_SIZES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

async function onDeviceSelect(deviceId) {
    canvas.stop();

    if (!audio) {
        audio = new Audio();
        const audioSettings = gui.addFolder('Audio').close();
        const displaySettings = gui.addFolder('Display').close();
        audioSettings.add({ fftSize: 4096 }, 'fftSize', FFT_SIZES).name('FFT bins').onChange(onFftChange);
        audioSettings.add(audio.gain.gain, 'value', 0, 8, 0.1).decimals(1).name('gain');
        audioSettings.add(audio.analyser, 'maxDecibels', -200, 100).name('max dB').setValue(-10);
        audioSettings.add(audio.analyser, 'minDecibels', -200, 100).name('min dB').setValue(-130);
        audioSettings.add(audio.analyser, 'smoothingTimeConstant', 0, 1, 0.1).name('smoothing').setValue(0);
        displaySettings.add({ palette: '' }, 'palette', Object.keys(palettes)).onChange(setPalette).setValue('gqrx')
    }

    try {
        audio.start(deviceId);
        canvas.start(audio);
    } catch (err) {
        alert(err.message)
        console.error(err)
    }
}

async function setPalette(theme) {
    canvas.setPalette(palettes[theme]);
}

async function onFftChange(v) {
    canvas.stop();
    audio.setFftSize(v);
    canvas.start(audio);
}

async function getMediaDevices(type) {
    const devices = await mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === type)
}

async function updateDevicesList() {
    const devList = {};
    const devices = await getMediaDevices('audioinput');

    devices.forEach((d, i) => {
        devList[d.label || `Input ${i}`] = d.deviceId;
    });

    // todo: fix doubling control
    deviceListControl.options(devList).onChange(onDeviceSelect);
}

window.addEventListener('resize', canvas.resize);

updateDevicesList();
mediaDevices.addEventListener('devicechange', updateDevicesList);

try {
    await navigator.wakeLock.request('screen');
} catch (_) { }

