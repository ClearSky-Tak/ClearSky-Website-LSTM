import { useEffect, useState } from 'react';

export default function DayNightIndicator() {
  const [isDay, setIsDay] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateDayNight = () => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      // Day: 06:00 - 18:00, Night: 18:01 - 05:59
      setIsDay(hour >= 6 && hour < 18);
    };

    updateDayNight();
    const interval = setInterval(updateDayNight, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`p-6 rounded-lg shadow-lg ${isDay ? 'bg-gradient-to-br from-blue-400 to-blue-200' : 'bg-gradient-to-br from-indigo-900 to-purple-900'} text-white`}>
      <div className="flex items-center justify-center gap-4">
        <div className="text-5xl">
          {isDay ? '☀️' : '🌙'}
        </div>
        <div className="flex flex-col">
          <h3 className="text-2xl font-bold">
            {isDay ? 'Day' : 'Night'}
          </h3>
          <p className="text-sm opacity-90">
            {isDay ? '06:00 - 18:00' : '18:01 - 05:59'}
          </p>
          <p className="text-xs mt-1 opacity-75">
            Waktu Sekarang: {currentTime.toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}
