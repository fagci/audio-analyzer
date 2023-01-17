import palettes from "./palettes.js"
import Canvas from './canvas.js'
import Audio from './audio.js'

let audio;

let canvas;

function updateGain() {
    audio.setGain(this.value)
}

function updateFftSize() {
    canvas.stop();
    audio.setFftSize(this.value)
    canvas.start(audio);
}

async function onDeviceSelect() {
    canvas.stop();

    if (!audio) {
        audio = new Audio(fftSize.value, inputGain.value);

        inputGain.addEventListener('change', updateGain);
        inputGain.addEventListener('mousemove', updateGain);
        inputGain.addEventListener('touchmove', updateGain);
        fftSize.addEventListener('change', updateFftSize);
    }

    try {
        audio.start(src.value);
        canvas.start(audio);
    } catch (err) {
        alert(`${err.message}\nTry to reload app and select same device`)
        console.error(err)
    }
}

async function getMediaDevices(type) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === type)
}

function createOption(d, i) {
    return `<option value="${d.deviceId}">${d.label ? d.label : 'Input ' + i}</option>`;
}

async function updateDevicesList() {
    const devices = await getMediaDevices('audioinput');
    src.innerHTML = "<option>Select device</option>" + devices.map(createOption).join("");
}

async function onPaletteSelect() {
    const palette = palettes[palettesSelect.value];
    canvas.setPalette(palette);
}

function initPalettesList() {
    palettesSelect.innerHTML =
        Object.keys(palettes)
            .map(p => `<option value="${p}">${p}</option>`)
            .join("");
    palettesSelect.value = 'gqrx';
    onPaletteSelect();
}

async function onPageLoad() {
    canvas = new Canvas();
    initPalettesList();
    updateDevicesList();
    navigator.mediaDevices.addEventListener('devicechange', updateDevicesList);
    window.addEventListener("resize", canvas.resize.bind(canvas));

    try {
        await navigator.wakeLock.request('screen');
    } catch (_) { }
}
setMinDb.addEventListener("click", () => { audio.setMinDecibels(prompt('Enter min dB value', audio.analyser.minDecibels)) });
setMaxDb.addEventListener("click", () => { audio.setMaxDecibels(prompt('Enter max dB value', audio.analyser.maxDecibels)) });

palettesSelect.addEventListener("change", onPaletteSelect);
src.addEventListener("change", onDeviceSelect);
window.addEventListener("load", onPageLoad);
