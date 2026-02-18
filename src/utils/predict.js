import * as tf from '@tensorflow/tfjs';

// Prefer assets from public folder so they are served at /assets/Model-V2/*
const PUB_MODEL_URL = '/assets/Model-V2/model.json';
const PUB_LABELS_URL = '/assets/Model-V2/labels.json';
const PUB_SCALER_URL = '/assets/Model-V2/scaler.json';
// Fallback to src path (dev only) if public path is unavailable
const SRC_MODEL_URL = '/src/assets/Model-V2/model.json';
const SRC_LABELS_URL = '/src/assets/Model-V2/labels.json';
const SRC_SCALER_URL = '/src/assets/Model-V2/scaler.json';

let graphModelPromise;
let labelsPromise;
let scalerPromise;

async function tryFetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

export async function loadArtifactsGraph() {
  if (!graphModelPromise) {
    graphModelPromise = tf.loadGraphModel(PUB_MODEL_URL).catch(() => tf.loadGraphModel(SRC_MODEL_URL));
  }
  if (!labelsPromise) {
    labelsPromise = tryFetchJson(PUB_LABELS_URL).catch(() => tryFetchJson(SRC_LABELS_URL));
  }
  if (!scalerPromise) {
    scalerPromise = tryFetchJson(PUB_SCALER_URL).catch(() => tryFetchJson(SRC_SCALER_URL));
  }
  const [model, labels, scaler] = await Promise.all([graphModelPromise, labelsPromise, scalerPromise]);
  return { model, labels, scaler };
}

function normalize(val, mean, std) {
  return (val - mean) / (std || 1);
}

export function timeFeatures(date = new Date()) {
  const d = new Date(date);
  const hour = d.getHours();
  const dow = d.getDay();
  const month = d.getMonth() + 1;
  return [
    hour, dow, month,
    Math.sin((2 * Math.PI * hour) / 24),
    Math.cos((2 * Math.PI * hour) / 24),
    Math.sin((2 * Math.PI * dow) / 7),
    Math.cos((2 * Math.PI * dow) / 7),
    Math.sin((2 * Math.PI * month) / 12),
    Math.cos((2 * Math.PI * month) / 12),
  ];
}

export function extraFeatures() {
  // No history in browser; keep zeros like script example
  return [0, 0, 0, 0];
}

export function windFeatures(kecepatan) {
  const wind_deg = 0;
  const wind_sin = 0;
  const wind_cos = 1;
  const wind_x = kecepatan * wind_cos;
  const wind_y = kecepatan * wind_sin;
  return [wind_deg, wind_sin, wind_cos, wind_x, wind_y];
}

export function dayMask(date = new Date()) {
  const d = new Date(date);
  const hour = d.getHours();
  const isDay = (hour >= 6 && hour < 18) ? 1.0 : 0.0;
  return tf.tensor([[isDay]]);
}

// Build feature vector with wind features: [values(5), time(9), extra(4), wind(5)] = 23 features
export function preprocessTSVector(values, date, scaler) {
  const [suhu, kelembapan, curah_hujan, kecepatan_angin, tutupan_awan] = values;
  const timeFeats = timeFeatures(date);
  const diffFeats = extraFeatures();
  const windFeats = windFeatures(kecepatan_angin);
  
  const feats = [
    suhu, kelembapan, curah_hujan, kecepatan_angin, tutupan_awan,
    ...timeFeats,
    ...diffFeats,
    ...windFeats
  ];
  
  const norm = scaler?.mean?.length === feats.length
    ? feats.map((v, i) => normalize(v, scaler.mean[i], scaler.std[i]))
    : feats;
  // Repeat for 24 time steps -> [1,24,23]
  const seq = Array(24).fill(norm);
  return tf.tensor([seq]);
}

export async function tensorFromDataURL(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res) => { img.onload = res; });
  return tf.tidy(() => tf.browser.fromPixels(img).resizeNearestNeighbor([224, 224]).toFloat().div(255).expandDims(0));
}

export async function tensorFromFile(file) {
  const reader = new FileReader();
  const dataUrl = await new Promise((res) => { reader.onload = () => res(reader.result); reader.readAsDataURL(file); });
  return tensorFromDataURL(dataUrl);
}

export function buildOWMValues(weather) {
  const temp = weather?.main?.temp ?? 0; // °C
  const humidity = weather?.main?.humidity ?? 0; // %
  const rain = weather?.rain?.['1h'] ?? weather?.rain?.['3h'] ?? 0; // mm
  const wind = weather?.wind?.speed ?? 0; // m/s
  const clouds = weather?.clouds?.all ?? 0; // %
  return [temp, humidity, rain, wind, clouds];
}

export async function predictFromModel({ weather, date = new Date(), dataUrl, file }) {
  const { model, labels, scaler } = await loadArtifactsGraph();
  const values = buildOWMValues(weather);
  const ts = preprocessTSVector(values, date, scaler);
  const img = file ? await tensorFromFile(file) : await tensorFromDataURL(dataUrl);
  const mask = dayMask(date);
  
  const out = await model.executeAsync({ 
    img_input: img, 
    ts_input: ts, 
    mask_day: mask 
  });
  
  const probsTensor = Array.isArray(out) ? out[0] : out;
  const probs = await probsTensor.data();
  const arr = Array.from(probs);
  let maxIdx = 0; let maxVal = -Infinity;
  for (let i = 0; i < arr.length; i++) { if (arr[i] > maxVal) { maxVal = arr[i]; maxIdx = i; } }
  const label = labels?.[String(maxIdx)] ?? String(maxIdx);
  img.dispose(); ts.dispose(); mask.dispose(); probsTensor.dispose();
  return { index: maxIdx, label, confidence: maxVal * 100, probs: arr, labels };
}

// Legacy exports kept for compatibility (no-op stubs for old usage)
export function buildFeatures() { return []; }
export async function predictWeatherClass() { return { index: 0, label: 'Cerah', confidence: 0, probs: [1,0,0] }; }
