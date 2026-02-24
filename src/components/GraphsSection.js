import React from 'react';
import './GraphsSection.css';
import SensorGraph from './SensorGraph';

const ORIENTATION_GAIN = 3; // amplify small orientation changes

const GraphsSection = ({ liveData }) => {
  // Helper to parse numeric values
  const parseValue = (val) => {
    if (!val || val === 'None' || val === '' || val === 'N/A') return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  };

  // Prepare real data only
  const orientationData = {
    Roll: liveData?.roll != null ? parseValue(liveData.roll) * ORIENTATION_GAIN : null,
    Pitch: liveData?.pitch != null ? parseValue(liveData.pitch) * ORIENTATION_GAIN : null,
    Yaw: liveData?.yaw != null ? parseValue(liveData.yaw) * ORIENTATION_GAIN : null,
  };

  const sensorData = {
    'G-Force': parseValue(liveData?.g),
    LDR: parseValue(liveData?.ldr),
    FLEX: parseValue(liveData?.flex),
  };

  const environmentalData = {
    Temperature: parseValue(liveData?.temp),
    Humidity: parseValue(liveData?.humidity),
  };

  // Check if we have any real data
  const hasOrientationData = orientationData.Roll != null || 
                             orientationData.Pitch != null || 
                             orientationData.Yaw != null;
  const hasSensorData = sensorData['G-Force'] != null || 
                       sensorData.LDR != null || 
                       sensorData.FLEX != null;
  const hasEnvironmentalData = environmentalData.Temperature != null || 
                              environmentalData.Humidity != null;
  const hasAnyData = hasOrientationData || hasSensorData || hasEnvironmentalData;

  return (
    <section className="graphs-section">
      {!hasAnyData ? (
        <div className="graphs-empty-state">
          <div className="empty-state-icon">📊</div>
          <h3 className="empty-state-title">No data available</h3>
          <p className="empty-state-description">
            Connect ESP32 to start visualizing sensor data
          </p>
        </div>
      ) : (
        <>
          {hasOrientationData && (
            <SensorGraph
              title="Orientation (Roll, Pitch, Yaw)"
              data={orientationData}
              dataKeys={['Roll', 'Pitch', 'Yaw']}
              colors={['#3b82f6', '#4da3e6', '#66b3f0']}
              maxDataPoints={100}
            />
          )}
          
          <div className="graphs-row">
            {hasSensorData && (
              <SensorGraph
                title="Sensor Readings"
                data={sensorData}
                dataKeys={['G-Force', 'LDR', 'FLEX']}
                colors={['#f59e0b', '#3b82f6', '#4da3e6']}
                maxDataPoints={50}
              />
            )}
            
            {hasEnvironmentalData && (
              <SensorGraph
                title="Environmental Data"
                data={environmentalData}
                dataKeys={['Temperature', 'Humidity']}
                colors={['#3b82f6', '#4da3e6']}
                maxDataPoints={50}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default GraphsSection;
