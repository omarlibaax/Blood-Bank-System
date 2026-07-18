import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="loading-state">
    <div className="spinner" />
    <span>{message}</span>
  </div>
);

export default LoadingSpinner;
