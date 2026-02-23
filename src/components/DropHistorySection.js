import React, { useMemo } from 'react';
import './DropHistorySection.css';
import AnimatedIcon from './AnimatedIcon';

/** Reduce peak events to one highest value per parameter */
function highestPeakPerParameter(peakEvents) {
  const byParam = {};
  for (const event of peakEvents) {
    const name = event?.parameter;
    const value = Number(event?.value);
    if (name == null || Number.isNaN(value)) continue;
    if (byParam[name] == null || value > byParam[name]) {
      byParam[name] = value;
    }
  }
  return Object.entries(byParam).map(([parameter, value]) => ({ parameter, value }));
}

const DropHistorySection = ({ peakEvents, loading }) => {
  const highestPeaks = useMemo(() => highestPeakPerParameter(peakEvents), [peakEvents]);

  if (loading && peakEvents.length === 0) {
    return (
      <section className="drop-section">
        <div className="drop-history-card">
          <div className="card-header">
            <h2 className="card-title">Peak Value</h2>
          </div>
          <div className="loading-state">
            <div className="spinner" />
            <p className="loading-text">Loading peak values...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="drop-section">
      <div className="drop-history-card">
        <div className="card-header">
          <div className="card-title-wrapper">
            <AnimatedIcon type="drop" className="title-icon" />
            <h2 className="card-title">Peak Value</h2>
          </div>
          <div className="card-header-right">
            {highestPeaks.length > 0 && (
              <span className="card-count">
                {highestPeaks.length} {highestPeaks.length === 1 ? 'parameter' : 'parameters'}
              </span>
            )}
          </div>
        </div>

        <div className="drop-history">
          {highestPeaks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3 className="empty-state-title">No peak values yet</h3>
              <p className="empty-state-description">
                Highest peak per parameter will appear here when detected from BLE.
              </p>
            </div>
          ) : (
            <div className="peak-values-wrap">
              {highestPeaks.map((event, index) => (
                <div
                  key={event.parameter}
                  className="peak-value-item"
                  style={{ '--peak-delay': `${index * 60}ms` }}
                >
                  <span className="peak-value-name">{event.parameter}</span>
                  <span className="peak-value-number">{Number(event.value).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DropHistorySection;
