import React, { useState, useEffect } from 'react';

export const SocketDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState({
    userId: '',
    socketConnected: false,
    socketId: '',
    lastEvent: '',
    token: '',
  });

  useEffect(() => {
    const updateInfo = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      setDebugInfo({
        userId: localStorage.getItem('userId') || 'not set',
        socketConnected: false, // You'll need to pass this from socket
        socketId: 'not connected',
        lastEvent: 'none',
        token: token ? 'exists' : 'missing',
      });
    };

    updateInfo();
    const interval = setInterval(updateInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs z-50">
      <div>User ID: {debugInfo.userId}</div>
      <div>Socket: {debugInfo.socketConnected ? '✅' : '❌'}</div>
      <div>Socket ID: {debugInfo.socketId}</div>
      <div>Token: {debugInfo.token}</div>
      <div>Last Event: {debugInfo.lastEvent}</div>
    </div>
  );
};