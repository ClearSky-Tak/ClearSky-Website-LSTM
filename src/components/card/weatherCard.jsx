import React, { useEffect, useState } from 'react';
import { WiDaySunny, WiCloud, WiRain, WiThunderstorm, WiCloudy, WiHumidity, WiStrongWind } from 'react-icons/wi';

/**
 * WeatherCard
 * Props:
 * - adm4: string (optional, fallback to env or default)
 *
 * Uses BMKG Prakiraan Cuaca API.
 */
export default function WeatherCard({ adm4 }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    const adm4Code = adm4 || import.meta.env.VITE_BMKG_ADM4 || '92.02.12.1001';
    const controller = new AbortController();

    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4Code}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Gagal memuat cuaca');
        const resData = await res.json();
        
        const now = new Date();
        let closestWeather = null;
        let minDiff = Infinity;

        if (resData.data && resData.data[0] && resData.data[0].cuaca) {
            const cuacaGroups = resData.data[0].cuaca;
            cuacaGroups.forEach(group => {
                group.forEach(item => {
                    const dataTime = new Date(item.local_datetime.replace(' ', 'T'));
                    const diff = Math.abs(now - dataTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestWeather = item;
                    }
                });
            });
        }
        
        if (closestWeather) {
          setWeather(closestWeather);
          const loc = resData.data[0].lokasi;
          if (loc) {
            setLocationName(`${loc.desa}, ${loc.kecamatan}`);
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      }
    };
    fetchWeather();
    return () => controller.abort();
  }, [adm4]);

  const pickIcon = (desc) => {
    switch ((desc || '').toLowerCase()) {
      case 'cerah': return <WiDaySunny className="text-yellow-500" size={28} />;
      case 'cerah berawan': return <WiCloudy className="text-yellow-600" size={28} />;
      case 'berawan': 
      case 'berawan tebal': return <WiCloudy className="text-gray-500" size={28} />;
      case 'hujan': 
      case 'hujan ringan':
      case 'hujan sedang': return <WiRain className="text-blue-500" size={28} />;
      case 'hujan lebat': return <WiThunderstorm className="text-purple-500" size={28} />;
      default: return <WiCloud className="text-gray-400" size={28} />;
    }
  };

  const dayString = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const d = new Date();
    return days[d.getDay()];
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Cuaca - {dayString()}</div>
        {weather && pickIcon(weather.weather_desc)}
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      {!weather ? (
        <div className="text-xs text-gray-500">Memuat cuaca…</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div className="col-span-2 font-medium">{locationName || 'Lokasi Anda'}</div>
          <div className="flex items-center gap-2"><span className="font-medium">Suhu:</span> {weather.t}°C</div>
          <div className="flex items-center gap-2"><span className="font-medium">Awan:</span> {weather.tcc}%</div>
          <div className="flex items-center gap-2"><WiHumidity size={20}/> <span className="font-medium">Kelembapan:</span> {weather.hu}%</div>
          <div className="flex items-center gap-2"><WiStrongWind size={20}/> <span className="font-medium">Angin:</span> {weather.ws} km/j</div>
          <div className="flex items-center gap-2"><span className="font-medium">Jarak Pandang:</span> {weather.vs_text}</div>
          <div className="col-span-2 text-xs text-gray-500 capitalize">{weather.weather_desc}</div>
        </div>
      )}
    </div>
  );
}
