import React from 'react';

export default function Sample() {
    return (
        <div className="container mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-center mb-8">Clear Sky PDF Samples</h1>

            <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                Halaman ini menampilkan dua contoh dokumen PDF untuk mode Clear Sky
                Day dan Clear Sky Night.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Day Card */}
                <div className="card bg-gradient-to-br from-blue-400 to-blue-200 shadow-xl">
                    <div className="card-body">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-5xl">☀️</span>
                            <div>
                                <h2 className="card-title text-white text-2xl">Clear Sky Day</h2>
                                <p className="text-white text-sm">06:00 - 18:00</p>
                            </div>
                        </div>

                        <p className="text-white mb-4 text-sm md:text-base">
                            Mode siang menggunakan <span className="font-semibold">kamera</span> untuk
                            mendeteksi kondisi awan dan memprediksi cuaca 1 jam ke depan.
                            Pastikan kamera aktif pada halaman <span className="font-semibold">Camera</span>
                            sebelum menggunakan laporan ini.
                        </p>



                        <div className="card-actions justify-center">
                            <a
                                href="/assets/Sample/ClearSkyDay.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                            >
                                Buka Day PDF
                            </a>
                        </div>
                    </div>
                </div>

                {/* Night Card */}
                <div className="card bg-gradient-to-br from-indigo-900 to-purple-900 shadow-xl">
                    <div className="card-body">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-5xl">🌙</span>
                            <div>
                                <h2 className="card-title text-white text-2xl">Clear Sky Night</h2>
                                <p className="text-white text-sm">18:01 - 05:59</p>
                            </div>
                        </div>

                        <p className="text-white mb-4 text-sm md:text-base">
                            Pada malam hari <span className="font-semibold">tidak menggunakan kamera</span>.
                            Mode ini hanya menggunakan data cuaca dan informasi lain untuk
                            menghasilkan laporan Clear Sky Night.
                        </p>



                        <div className="card-actions justify-center">
                            <a
                                href="/assets/Sample/ClearSkyNight.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                            >
                                Buka Night PDF
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
