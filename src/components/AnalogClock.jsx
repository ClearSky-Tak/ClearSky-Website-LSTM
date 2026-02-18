import { useEffect, useState } from 'react';

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 rounded-full border-4 border-gray-800 bg-white shadow-lg">
        {/* Clock numbers */}
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, idx) => {
          const angle = (idx * 30 - 60) * (Math.PI / 180);
          const x = 50 + 38 * Math.cos(angle);
          const y = 50 + 38 * Math.sin(angle);
          return (
            <div
              key={num}
              className="absolute text-sm font-bold"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {num}
            </div>
          );
        })}

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20"></div>

        {/* Hour hand */}
        <div
          className="absolute top-1/2 left-1/2 origin-bottom bg-gray-800 rounded-full"
          style={{
            width: '6px',
            height: '30%',
            transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`,
            transformOrigin: 'bottom center'
          }}
        ></div>

        {/* Minute hand */}
        <div
          className="absolute top-1/2 left-1/2 origin-bottom bg-gray-600 rounded-full"
          style={{
            width: '4px',
            height: '40%',
            transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`,
            transformOrigin: 'bottom center'
          }}
        ></div>

        {/* Second hand */}
        <div
          className="absolute top-1/2 left-1/2 origin-bottom bg-red-500 rounded-full"
          style={{
            width: '2px',
            height: '45%',
            transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`,
            transformOrigin: 'bottom center'
          }}
        ></div>
      </div>
      <div className="mt-3 text-lg font-semibold">
        {time.toLocaleTimeString('id-ID')}
      </div>
    </div>
  );
}
