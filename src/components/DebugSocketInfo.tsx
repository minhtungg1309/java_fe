import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

export const DebugSocketInfo: React.FC = () => {
  const [socketInfo, setSocketInfo] = useState({
    connected: false,
    socketId: '',
    lastEvent: '',
    eventCount: 0,
  });

  const socketRef = useSocket(
    (message) => {
      setSocketInfo(prev => ({
        ...prev,
        lastEvent: `message: ${JSON.stringify(message)}`,
        eventCount: prev.eventCount + 1,
      }));
    },
    (offer) => {
      setSocketInfo(prev => ({
        ...prev,
        lastEvent: `incoming-call: ${offer.callerId}`,
        eventCount: prev.eventCount + 1,
      }));
    },
    (answer) => {
      setSocketInfo(prev => ({
        ...prev,
        lastEvent: `call-answered: ${answer.calleeId}`,
        eventCount: prev.eventCount + 1,
      }));
    },
    (candidate) => {
      setSocketInfo(prev => ({
        ...prev,
        lastEvent: `ice-candidate: ${candidate.fromUserId}`,
        eventCount: prev.eventCount + 1,
      }));
    },
    (status) => {
      setSocketInfo(prev => ({
        ...prev,
        lastEvent: `call-status: ${status.event}`,
        eventCount: prev.eventCount + 1,
      }));
    },
    (ended) => {
      setSocketInfo(prev => ({
        ...prev,
        lastEvent: `call-ended: ${ended.callId}`,
        eventCount: prev.eventCount + 1,
      }));
    }
  );

  useEffect(() => {
    const socket = socketRef.current;
    if (socket) {
      const updateStatus = () => {
        setSocketInfo(prev => ({
          ...prev,
          connected: socket.connected,
          socketId: socket.id || '',
        }));
      };

      socket.on('connect', updateStatus);
      socket.on('disconnect', updateStatus);
      
      updateStatus(); // Initial check

      return () => {
        socket.off('connect', updateStatus);
        socket.off('disconnect', updateStatus);
      };
    }
  }, [socketRef]);

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs max-w-xs z-50">
      <h4 className="font-bold mb-2">🔌 Socket Debug</h4>
      <div className="space-y-1">
        <div>
          <strong>Status:</strong> 
          <span className={socketInfo.connected ? 'text-green-400' : 'text-red-400'}>
            {socketInfo.connected ? ' Connected' : ' Disconnected'}
          </span>
        </div>
        <div><strong>Socket ID:</strong> {socketInfo.socketId || 'N/A'}</div>
        <div><strong>Events:</strong> {socketInfo.eventCount}</div>
        <div><strong>Last Event:</strong></div>
        <div className="text-gray-300 text-xs break-words">
          {socketInfo.lastEvent || 'None'}
        </div>
      </div>
    </div>
  );
};