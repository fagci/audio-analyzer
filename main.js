import palettes from "./palettes.js"
import Canvas from './canvas.js'
import Audio from './audio.js'

let audio;

let canvas;
const GUI = lil.GUI;
const gui = new GUI({ title: 'Settings' });
const deviceSettings = gui.addFolder('Device');
const audioSettings = gui.addFolder('Audio');
const displaySettings = gui.addFolder('Display');

async function onDeviceSelect(deviceId) {
    canvas.stop();

    if (!audio) {
        audio = new Audio(4096, 1);
        const an = audio.getAnalyser();
        audioSettings.add(an, 'minDecibels', -200, 100).name('min dB')
        audioSettings.add(an, 'maxDecibels', -200, 100).name('max dB')
        audioSettings.add(audio.getGain().gain, 'value', 0, 50, 0.5).name('gain')
        displaySettings.add({ fftSize: 4096 }, 'fftSize', [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]).name('FFT bins').onChange(v => {
            canvas.stop();
            audio.setFftSize(v);
            canvas.start(audio);
        });
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
    })
    deviceSettings.add({device: 'Select input device'}, 'device', devList).name('Input').onChange(onDeviceSelect)
}

async function onPageLoad() {
    canvas = new Canvas();
    updateDevicesList();
    navigator.mediaDevices.addEventListener('devicechange', updateDevicesList);
    window.addEventListener("resize", canvas.resize.bind(canvas));

    displaySettings.add({ palette: '' }, 'palette', Object.keys(palettes)).onChange(theme => {
        canvas.setPalette(palettes[theme]);
    }).setValue('gqrx')

    try {
        await navigator.wakeLock.request('screen');
    } catch (_) { }
}

window.addEventListener("load", onPageLoad);
