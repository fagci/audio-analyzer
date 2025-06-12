import palettes from "./palettes.js"
import Canvas from './canvas.js'
import Audio from './audio.js'
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm'

let audio;
const canvas = new Canvas();
const gui = new GUI({ title: 'Settings', autoPlace: true });
const deviceListControl = gui.add({ device: 'Select device' }, 'device').name('Input');
const mediaDevices = navigator.mediaDevices;

let oscStates = [false, false, false];

const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const defaultFFTSize = isMobile ? 2048 : 4096;

const FFT_SIZES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];

async function onDeviceSelect(deviceId) {
    if (audio) {
        canvas.stop();
        audio.cleanup();
    }

    if (!audio) {
        audio = new Audio();
        const audioSettings = gui.addFolder('Audio').close();
        const displaySettings = gui.addFolder('Display').close();
        // const oscSettings = gui.addFolder('Osc').close();
        // const osc1Settings = oscSettings.addFolder('Osc 1').close();

        /* osc1Settings
            .add(audio.osc[0].frequency, 'value', 0, 24000, 440)
            .setValue(localStorage.getItem('osc1f') || 440)
            .onChange((v) => { 
                localStorage.setItem('osc1f', v);
                audio.setOscF(0, v);
            })
            .name('osc1f');

        osc1Settings
            .add(oscStates, '0')
            .onChange((v) => {audio.setOscState(0, v);})
            .name('On') */


        audioSettings
            .add(audio.gain.gain, 'value', 1, 46, 1)
            .setValue(localStorage.getItem('gain') || 1)
            .onChange((v) => { localStorage.setItem('gain', v) })
            .name('gain');

        audioSettings
            .add(audio.analyser, 'maxDecibels', -200, 100)
            .name('max dB')
            .setValue(localStorage.getItem('maxDecibels') || -30)
            .onChange((v) => { localStorage.setItem('maxDecibels', v) });

        audioSettings
            .add(audio.analyser, 'minDecibels', -200, 100)
            .name('min dB')
            .setValue(localStorage.getItem('minDecibels') || -145)
            .onChange((v) => { localStorage.setItem('minDecibels', v) });

        audioSettings
            .add({ autorange: audio.autorange }, 'autorange')
            .name('Auto');

        displaySettings
            .add({ palette: '' }, 'palette', Object.keys(palettes))
            .onChange(setPalette)
            .setValue(localStorage.getItem('palette') || 'gqrx');

        displaySettings
            .add({ fftSize: defaultFFTSize }, 'fftSize', FFT_SIZES)
            .name('FFT bins')
            .setValue(localStorage.getItem('fftSize') || defaultFFTSize)
            .onChange(onFftChange);

        displaySettings
            .add(audio.analyser, 'smoothingTimeConstant', 0, 1, 0.1)
            .name('smoothing')
            .setValue(0);

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
    try {
        // Запрашиваем разрешение на доступ к микрофону
        await mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
        console.log('Доступ к микрофону отклонён:', error);
    }

    // Получаем список устройств даже при ошибке доступа
    const devices = await mediaDevices.enumerateDevices();
    console.log(devices);
    return devices.filter(device => device.kind === type);
}

async function updateDevicesList() {
    const devices = await getMediaDevices('audioinput');
    const devList = {};

    devices.forEach((d, i) => {
        // Используем уникальный идентификатор, если метка отсутствует
        const label = d.label || `Устройство ${i + 1}`;
        devList[label] = d.deviceId;
    });

    // Обновляем элементы управления
    deviceListControl.options(devList).onChange(onDeviceSelect);
}



window.addEventListener('load', async function() {
    window.addEventListener('resize', canvas.resize, { passive: true });

    updateDevicesList();
    mediaDevices.addEventListener('devicechange', updateDevicesList);

    try {
        await navigator.wakeLock.request('screen');
    } catch (_) { }
});

window.addEventListener('beforeunload', () => {
    if (audio) {
        audio.cleanup();
    }
    canvas.stop();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Приостановить обработку при скрытии страницы
        canvas.stop();
        if (audio && audio.audioContext) {
            audio.audioContext.suspend();
        }
    } else {
        // Возобновить при возвращении
        if (audio && audio.audioContext) {
            audio.audioContext.resume().then(() => {
                canvas.start(audio);
            });
        }
    }
});
