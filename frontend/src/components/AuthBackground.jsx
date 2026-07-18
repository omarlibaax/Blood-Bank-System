import React from 'react';

const circles = [
  { size: 120, top: '8%', left: '12%', delay: '0s', duration: '22s', opacity: 0.12 },
  { size: 80, top: '65%', left: '8%', delay: '2s', duration: '18s', opacity: 0.1 },
  { size: 200, top: '15%', left: '72%', delay: '1s', duration: '26s', opacity: 0.08 },
  { size: 60, top: '78%', left: '68%', delay: '3s', duration: '16s', opacity: 0.14 },
  { size: 150, top: '42%', left: '85%', delay: '0.5s', duration: '24s', opacity: 0.09 },
  { size: 90, top: '28%', left: '38%', delay: '4s', duration: '20s', opacity: 0.11 },
  { size: 50, top: '55%', left: '22%', delay: '1.5s', duration: '14s', opacity: 0.15 },
  { size: 110, top: '82%', left: '42%', delay: '2.5s', duration: '21s', opacity: 0.1 },
  { size: 70, top: '5%', left: '52%', delay: '3.5s', duration: '17s', opacity: 0.13 },
  { size: 180, top: '48%', left: '55%', delay: '0.8s', duration: '28s', opacity: 0.07 },
  { size: 40, top: '35%', left: '5%', delay: '5s', duration: '13s', opacity: 0.16 },
  { size: 95, top: '70%', left: '88%', delay: '2.2s', duration: '19s', opacity: 0.11 },
];

const AuthBackground = () => (
  <div className="auth-bg" aria-hidden="true">
    <div className="auth-bg-gradient" />
    {circles.map((c, i) => (
      <span
        key={i}
        className="auth-circle"
        style={{
          width: c.size,
          height: c.size,
          top: c.top,
          left: c.left,
          opacity: c.opacity,
          animationDelay: c.delay,
          animationDuration: c.duration,
        }}
      />
    ))}
  </div>
);

export default AuthBackground;
