import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './design-system.css';
import './App.css';
import ParticleBackground from './components/ParticleBackground';
import FloatingElements from './components/FloatingElements';
import Header from './components/Header';
import LiveDataSection from './components/LiveDataSection';
import GraphsSection from './components/GraphsSection';
import DropHistorySection from './components/DropHistorySection';
import RawDataSection from './components/RawDataSection';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [liveData, setLiveData] = useState({});
  const [peakEvents, setPeakEvents] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [espConnected, setEspConnected] = useState(false);
  const socketRef = useRef(null);

  const fetchData = async () => {
    try {
      const [liveResponse, peakEventsResponse, rawDataResponse, statusResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/live`),
        fetch(`${API_BASE_URL}/api/peak-events`),
        fetch(`${API_BASE_URL}/api/raw-data`),
        fetch(`${API_BASE_URL}/api/status`)
      ]);

      const liveDataData = await liveResponse.json();
      const peakEventsData = await peakEventsResponse.json();
      const rawDataData = await rawDataResponse.json();
      try {
        const statusData = statusResponse.ok ? await statusResponse.json() : {};
        if (typeof statusData.connected === 'boolean') {
          setEspConnected(statusData.connected);
        }
      } catch {
        /* ignore status parse errors */
      }

      if (liveDataData && typeof liveDataData === 'object') {
        setLiveData(liveDataData);
        if (typeof liveDataData.connected === 'boolean') {
          setEspConnected(liveDataData.connected);
        }
      } else {
        setLiveData({});
      }

      if (peakEventsData && Array.isArray(peakEventsData)) {
        setPeakEvents(peakEventsData);
      } else {
        setPeakEvents([]);
      }

      if (rawDataData && Array.isArray(rawDataData)) {
        setRawData(rawDataData);
      } else {
        setRawData([]);
      }

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLiveData({});
      setPeakEvents([]);
      setRawData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    const hydrate = async () => {
      try {
  
        await fetchData(); 
        setLoading(false);
      } catch (err) {
        console.error("Initial hydration failed", err);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    // Use HTTP long-polling only; Werkzeug dev server used in hi.py
    // does not support native WebSockets, and WebSocket attempts
    // cause 500 errors in the logs.
    const socket = io(API_BASE_URL, { transports: ['polling'] });
    socketRef.current = socket;

    socket.on('connect', () => console.log('WebSocket connected'));
    socket.on('disconnect', () => console.log('WebSocket disconnected'));

    socket.on('esp_status', (payload) => {
      if (payload && typeof payload.connected === 'boolean') {
        setEspConnected(payload.connected);
      }
    });

    socket.on('live_data', (payload) => {
      if (payload && typeof payload === 'object') {
        setLiveData((prev) => ({ ...prev, ...payload }));
        setLastUpdate(new Date());
        if (payload.connected === true) {
          setEspConnected(true);
        }
      }
    });

    socket.on('peak_event', (event) => {
      if (event && typeof event === 'object') {
        setPeakEvents((prev) => [event, ...prev].slice(0, 1000));
      }
    });

    socket.on('peak_events_batch', (events) => {
      if (events && Array.isArray(events)) {
        setPeakEvents(events);
      }
    });

    socket.on('raw_data', (entry) => {
      if (entry && typeof entry === 'object') {
        setRawData((prev) => [...prev, entry].slice(-1000));
      }
    });

    socket.on('raw_data_batch', (entries) => {
      if (entries && Array.isArray(entries)) {
        setRawData(entries);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  return (
    <div className="App">
      <ParticleBackground />
      <FloatingElements />
      <div className="container">
        <Header onRefresh={handleRefresh} lastUpdate={lastUpdate} espConnected={espConnected} />
        <DropHistorySection peakEvents={peakEvents} loading={loading} />
        <LiveDataSection data={liveData} />
        <GraphsSection liveData={liveData} />
        <RawDataSection rawData={rawData} />
      </div>
    </div>
  );
}

export default App;
