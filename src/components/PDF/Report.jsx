import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import LocationCard from '../card/LocationCard.jsx';
import DayNightIndicator from '../DayNightIndicator.jsx';

export default function Report() {
  const { state } = useLocation();
  const imgData = state?.imgData;
  const result = state?.result || { cerah: null, berawan: null, hujan: null };
  const history = state?.history || [];
  const deviceInfo = state?.deviceInfo || 'Unknown';
  const latency = state?.latency || '-';
  const location = state?.location || { lat: null, lng: null, address: '' };

  return (
    <div className="bg-white p-8 print:p-0 min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center mb-6">
        <img
          src="/assets/logoUnipa.webp"
          alt="Logo Universitas Papua"
          className="w-20 h-20 object-contain mr-4"
          style={{ marginLeft: '8px' }}
        />
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-right">ClearSky</span>
          <span className="text-lg text-right mt-1">Universitas Papua</span>
        </div>
      </div>

      {/* Judul Hasil */}
      <div className="text-center mt-8 mb-2">
        <span className="text-2xl font-bold">Hasil</span>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-md text-gray-700 font-medium">Device User: {deviceInfo}</p>
      </div>

      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="w-full max-w-sm">
          <LocationCard lat={location.lat} lng={location.lng} address={location.address} />
        </div>
        <div className="w-full max-w-sm flex items-center justify-center">
          <DayNightIndicator />
        </div>
      </div>

      {/* Gambar hasil capture */}
      {imgData && (
        <div className="flex justify-center mb-6">
          <img
            src={imgData}
            alt="Capture"
            className="rounded-lg shadow-lg max-w-xl w-full"
            style={{ border: '2px solid #eee' }}
          />
        </div>
      )}

      {/* Tabel Result */}
      <div className="flex justify-center">
        <table className="w-full max-w-xl border-collapse rounded-lg overflow-hidden shadow-lg bg-white">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="py-3 px-4 text-lg font-semibold">Kelas</th>
              <th className="py-3 px-4 text-lg font-semibold">Persentase</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="py-2 px-4 font-semibold">Cerah</td>
              <td className="py-2 px-4">{result.cerah ?? '-'}%</td>
            </tr>
            <tr>
              <td className="py-2 px-4 font-semibold">Berawan</td>
              <td className="py-2 px-4">{result.berawan ?? '-'}%</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 px-4 font-semibold">Hujan</td>
              <td className="py-2 px-4">{result.hujan ?? '-'}%</td>
            </tr>
            <tr>
              <td className="py-2 px-4 font-semibold text-blue-800">Latency</td>
              <td className="py-2 px-4 font-semibold text-blue-800">{latency} ms</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Riwayat Tiap Menit */}
      <div className="flex justify-center mt-8">
        <div className="w-full max-w-2xl">
          <h3 className="text-lg font-semibold mb-2">Riwayat Tiap Menit</h3>
          <table className="w-full border-collapse rounded-lg overflow-hidden shadow bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-800">
                <th className="py-2 px-3 text-left">Waktu</th>
                <th className="py-2 px-3 text-left">Cerah</th>
                <th className="py-2 px-3 text-left">Berawan</th>
                <th className="py-2 px-3 text-left">Hujan</th>
                <th className="py-2 px-3 text-left">Latency</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan="5" className="py-3 px-3 text-center opacity-60">Belum ada riwayat</td></tr>
              ) : (
                history.map((h, i) => (
                  <tr key={i} className={i % 2 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-3">{h.time}</td>
                    <td className="py-2 px-3">{h.cerah}%</td>
                    <td className="py-2 px-3">{h.berawan}%</td>
                    <td className="py-2 px-3">{h.hujan}%</td>
                    <td className="py-2 px-3">{h.latency} ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-center mt-8 not-print">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-800 transition font-semibold shadow not-print"
        >
          Print/Save as PDF
        </button>
        <NavLink to="/camera"
          className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-600 transition font-semibold shadow no-print"
        >
          Back to Camera
        </NavLink>
      </div>
    </div>
  );
}