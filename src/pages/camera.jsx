import React, { useRef, useState, useEffect } from 'react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import LocationCard from '../components/card/LocationCard.jsx';
import WeatherCard from '../components/card/weatherCard.jsx';
import AnalogClock from '../components/AnalogClock.jsx';
import DayNightIndicator from '../components/DayNightIndicator.jsx';
import { predictFromModel } from '../utils/predict.js';

export default function Camera() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [result, setResult] = useState({ cerah: null, berawan: null, hujan: null, top: '' });
    const [history, setHistory] = useState([]); // {time, cerah, berawan, hujan}
    const [loading, setLoading] = useState(false);
    const [fileImage, setFileImage] = useState(null);
    const [weather, setWeather] = useState(null);
    const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
    // Responsive flags
    const [isMobile, setIsMobile] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
    // Camera devices and selection
    const [devices, setDevices] = useState([]); // list of videoinput devices
    const [selectedDeviceId, setSelectedDeviceId] = useState(''); // desktop selection
    const [facing] = useState('environment'); // mobile: 'user' | 'environment'
    const navigate = useNavigate();

    // Helper: stop current video stream
    const stopStream = () => {
        const v = videoRef.current;
        const stream = v && v.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(t => t.stop());
        }
        if (v) v.srcObject = null;
    };

    // Helper: (re)start stream with constraints
    const startStream = async ({ deviceId, facingMode } = {}) => {
        try {
            stopStream();
            const base = { audio: false };
            let video;
            if (deviceId) {
                video = { deviceId: { exact: deviceId } };
            } else if (facingMode) {
                video = { facingMode: { ideal: facingMode } };
            } else {
                video = true;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ ...base, video });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }
            // update devices list (labels require permission)
            const list = await navigator.mediaDevices.enumerateDevices();
            const vids = list.filter(d => d.kind === 'videoinput');
            setDevices(vids);
            // set selected device id based on active track
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings?.() || {};
            if (settings.deviceId) setSelectedDeviceId(settings.deviceId);
        } catch {
            // fallback attempts
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(() => {});
                }
                const list = await navigator.mediaDevices.enumerateDevices();
                const vids = list.filter(d => d.kind === 'videoinput');
                setDevices(vids);
                const track = stream.getVideoTracks()[0];
                const settings = track.getSettings?.() || {};
                if (settings.deviceId) setSelectedDeviceId(settings.deviceId);
            } catch { /* ignore */ }
        }
    };

    // Setup breakpoints and geolocation once
    useEffect(() => {
        const updateBP = () => {
            const w = window.innerWidth;
            const mobile = w < 768;
            setIsMobile(mobile);
            setIsDesktop(!mobile);
        };
        updateBP();
        window.addEventListener('resize', updateBP);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setLocation((prev) => ({ ...prev, lat: latitude, lng: longitude }));
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                        .then((r) => r.json())
                        .then((data) => {
                            const addr = data?.display_name;
                            if (addr) setLocation((prev) => ({ ...prev, address: addr }));
                        })
                        .catch(() => {});
                },
                () => {},
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
        return () => {
            window.removeEventListener('resize', updateBP);
        };
    }, []);

    // Fetch weather data setiap menit
    useEffect(() => {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!apiKey || !location.lat || !location.lng) return;

        const fetchWeather = () => {
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric&lang=id`)
                .then(res => res.json())
                .then(setWeather)
                .catch(() => {});
        };

        // Fetch immediately
        fetchWeather();

        // Fetch setiap 1 menit (60000ms)
        const intervalId = setInterval(fetchWeather, 60000);

        return () => clearInterval(intervalId);
    }, [location.lat, location.lng]);

    // Start/refresh camera stream when deviceId or facing/mobile changes
    useEffect(() => {
        if (!navigator.mediaDevices?.getUserMedia) return;
        if (isDesktop && selectedDeviceId) {
            startStream({ deviceId: selectedDeviceId });
            return () => { stopStream(); };
        }
        if (isMobile) {
            startStream({ facingMode: facing });
            return () => { stopStream(); };
        }
        // default
        startStream({});
        return () => { stopStream(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMobile, isDesktop, selectedDeviceId, facing]);

    // (old helper removed)

    // Capture current frame as DataURL for model input
    const captureDataURL = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth) return null;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    };

    // Predict loop: every ~2s attempt, with 5s timeout+retry while loading
    useEffect(() => {
        if (!weather) return;
        let intervalId;
        let inFlight = false;
        const predictTick = async () => {
            if (inFlight) return;
            inFlight = true;
            setLoading(true);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            try {
                const date = new Date();
                const dataUrl = fileImage ? null : captureDataURL();
                const args = fileImage ? { file: fileImage } : { dataUrl };
                const pred = await predictFromModel({ weather, date, ...args });
                const labels = pred.labels || { '0': 'Cerah', '1': 'Berawan', '2': 'Hujan' };
                // Try to map to indices 0/1/2; fallback by matching label text
                const toPct = (idxOrName) => {
                    if (typeof idxOrName === 'number') return Math.round((pred.probs?.[idxOrName] ?? 0) * 100);
                    const index = Object.values(labels).findIndex(l => String(l).toLowerCase().includes(idxOrName));
                    return Math.round((pred.probs?.[index] ?? 0) * 100);
                };
                const cerah = toPct(0) || toPct('cerah');
                const berawan = toPct(1) || toPct('awan');
                const hujan = toPct(2) || toPct('hujan');
                setResult({ cerah, berawan, hujan, top: pred.label });
                // Append history each minute (when seconds roll over near 0)
                if (date.getSeconds() < 2) {
                    setHistory((h) => [...h, { time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), cerah, berawan, hujan }].slice(-120));
                }
            } catch {
                // If failed or timed out, try one immediate retry with a fresh frame
                try {
                    const date = new Date();
                    const dataUrl = fileImage ? null : captureDataURL();
                    const args = fileImage ? { file: fileImage } : { dataUrl };
                    const pred = await predictFromModel({ weather, date, ...args });
                    const labels = pred.labels || { '0': 'Cerah', '1': 'Berawan', '2': 'Hujan' };
                    const toPct = (idxOrName) => {
                        if (typeof idxOrName === 'number') return Math.round((pred.probs?.[idxOrName] ?? 0) * 100);
                        const index = Object.values(labels).findIndex(l => String(l).toLowerCase().includes(idxOrName));
                        return Math.round((pred.probs?.[index] ?? 0) * 100);
                    };
                    const cerah = toPct(0) || toPct('cerah');
                    const berawan = toPct(1) || toPct('awan');
                    const hujan = toPct(2) || toPct('hujan');
                    setResult({ cerah, berawan, hujan, top: pred.label });
                } catch { /* ignore */ }
            } finally {
                clearTimeout(timeout);
                setLoading(false);
                inFlight = false;
            }
        };
        intervalId = setInterval(predictTick, 2000);
        return () => clearInterval(intervalId);
    }, [weather, fileImage]);

    // Fungsi untuk membuat dan mendownload PDF
    const handleReport = () => {
        const imgData = captureDataURL();
        navigate('/report', {
            state: {
                imgData,
                result,
                history,
            }
        });
    };

    const onFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) { setFileImage(null); return; }
        if (!f.type.startsWith('image/')) { alert('Hanya file gambar yang diperbolehkan'); return; }
        setFileImage(f);
    };

    // Handlers for desktop dropdown and mobile flip
    const onSelectDevice = async (e) => {
        const id = e.target.value;
        setSelectedDeviceId(id);
        await startStream({ deviceId: id });
    };
    // const onFlip = async () => {
    //     const next = facing === 'environment' ? 'user' : 'environment';
    //     setFacing(next);
    //     // Try facingMode. If not honored, choose device by label keyword if available
    //     if (devices.length > 0) {
    //         const target = devices.find(d => d.label.toLowerCase().includes(next === 'environment' ? 'back' : 'front'))
    //             || devices.find(d => d.label.toLowerCase().includes(next === 'environment' ? 'rear' : 'user'));
    //         if (target) {
    //             setSelectedDeviceId(target.deviceId);
    //             await startStream({ deviceId: target.deviceId });
    //             return;
    //         }
    //     }
    //     await startStream({ facingMode: next });
    // };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* On mobile: show Location & Weather above camera */}
            {isMobile && (
                <div className="w-full grid grid-cols-1 gap-4 mb-4">
                    <LocationCard lat={location.lat} lng={location.lng} address={location.address} />
                        <WeatherCard lat={location.lat} lng={location.lng} />
                </div>
            )}
            <div className="flex flex-col md:flex-row gap-8">
                {/* Area Kamera */}
                <div className="md:w-1/2 flex flex-col items-center">
                    <h2 className="text-xl font-bold mb-4">Area Kamera</h2>
                    {/* Camera dropdown for all devices */}
                    <div className="w-full max-w-md mb-3 flex items-center gap-2">
                        <label className="font-medium">Kamera:</label>
                        <select value={selectedDeviceId} onChange={onSelectDevice} className="select select-bordered w-full">
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${d.deviceId.slice(0,6)}`}</option>
                            ))}
                        </select>
                    </div>
                    <video ref={videoRef} className="w-full rounded shadow mb-4" autoPlay />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <input type="file" accept="image/*" onChange={onFileChange} className="file-input file-input-bordered w-full max-w-md" />
                </div>

                {/* Area Hasil Deteksi */}
                <div className="md:w-1/2 flex flex-col items-center justify-start gap-4">
                    {/* Desktop/Tablet: show Location & Weather at top of right column */}
                    {isDesktop && (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <LocationCard lat={location.lat} lng={location.lng} address={location.address} />
                            <WeatherCard lat={location.lat} lng={location.lng} />
                        </div>
                    )}

                    {/* Jam Analog dan Day/Night Indicator */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-center items-center">
                            <AnalogClock />
                        </div>
                        <div className="flex justify-center items-center">
                            <DayNightIndicator />
                        </div>
                    </div>

                    <h2 className="text-xl font-bold mt-4">Hasil Deteksi (Perkiraan 1 Jam kedepan)</h2>
                    <div className="flex justify-center w-full mb-4">
                        <table className="w-full max-w-xl border-collapse rounded-lg overflow-hidden shadow-lg bg-white">
                            <thead>
                                <tr className="bg-blue-600 text-white">
                                    <th className="py-3 px-4 text-lg font-semibold">Kelas</th>
                                    <th className="py-3 px-4 text-lg font-semibold">Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-2 px-4 font-semibold">Cerah</td>
                                    <td className="py-2 px-4">
                                        {loading || result.cerah === null ? (
                                            <span className="loading loading-dots loading-md"></span>
                                        ) : (
                                            `${result.cerah}%`
                                        )}
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="py-2 px-4 font-semibold">Berawan</td>
                                    <td className="py-2 px-4">
                                        {loading || result.berawan === null ? (
                                            <span className="loading loading-dots loading-md"></span>
                                        ) : (
                                            `${result.berawan}%`
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 font-semibold">Hujan</td>
                                    <td className="py-2 px-4">
                                        {loading || result.hujan === null ? (
                                            <span className="loading loading-dots loading-md"></span>
                                        ) : (
                                            `${result.hujan}%`
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* History per menit */}
                    <div className="w-full max-w-xl">
                        <h3 className="font-semibold mb-2">Riwayat Tiap Menit</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse rounded-lg overflow-hidden shadow bg-white">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-800">
                                        <th className="py-2 px-3 text-left">Waktu</th>
                                        <th className="py-2 px-3 text-left">Cerah</th>
                                        <th className="py-2 px-3 text-left">Berawan</th>
                                        <th className="py-2 px-3 text-left">Hujan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length === 0 ? (
                                        <tr><td colSpan="4" className="py-3 px-3 text-center opacity-60">Belum ada riwayat</td></tr>
                                    ) : (
                                        history.map((h, i) => (
                                            <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}>
                                                <td className="py-2 px-3">{h.time}</td>
                                                <td className="py-2 px-3">{h.cerah}%</td>
                                                <td className="py-2 px-3">{h.berawan}%</td>
                                                <td className="py-2 px-3">{h.hujan}%</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <button
                        onClick={handleReport}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-800 transition font-semibold shadow"
                    >
                        Report PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
