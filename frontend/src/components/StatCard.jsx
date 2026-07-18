import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendUp, onClick }) => (
  <div
    className={`card stat-item-card ${onClick ? 'stat-item-card-clickable' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
  >
    <div className="stat-content">
      <h3>{title}</h3>
      <div className="stat-value">{value}</div>
      {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      {trend && (
        <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </span>
      )}
    </div>
    {Icon && (
      <div className="stat-icon-wrapper" style={{ backgroundColor: iconBg, color: iconColor }}>
        <Icon size={22} />
      </div>
    )}
  </div>
);

export default StatCard;
