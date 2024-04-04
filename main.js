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

        audioSettings
            .add({ fftSize: 4096 }, 'fftSize', FFT_SIZES)
            .name('FFT bins')
            .setValue(localStorage.getItem('fftSize') || 4096)
            .onChange(onFftChange);

        audioSettings
            .add(audio.gain.gain, 'value', 0, 8)
            .decimals(1)
            .setValue(localStorage.getItem('gain') || 0.1)
            .onChange((v) => { localStorage.setItem('gain', v) })
            .name('gain');

        audioSettings
            .add(audio.analyser, 'maxDecibels', -200, 100)
            .name('max dB')
            .setValue(localStorage.getItem('maxDecibels') || -10)
            .onChange((v) => { localStorage.setItem('maxDecibels', v) });

        audioSettings
            .add(audio.analyser, 'minDecibels', -200, 100)
            .name('min dB')
            .setValue(localStorage.getItem('minDecibels') || -130)
            .onChange((v) => { localStorage.setItem('minDecibels', v) });

        audioSettings
            .add(audio.analyser, 'smoothingTimeConstant', 0, 1, 0.1)
            .name('smoothing')
            .setValue(0);

        displaySettings
            .add({ palette: '' }, 'palette', Object.keys(palettes))
            .onChange(setPalette)
            .setValue(localStorage.getItem('palette') || 'gqrx');

        gui
            .add({ calibrate: canvas.calibrate }, 'calibrate')
            .name('Calibrate (experimental)');
        gui
            .add({
                clear() {
                    localStorage.clear();
                    window.location.reload();
                }
            }, 'clear')
            .name('Reset settings');
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
    localStorage.setItem('palette', theme);
    canvas.setPalette(palettes[theme]);
}

async function onFftChange(v) {
    canvas.stop();
    localStorage.setItem('fftSize', v)
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

