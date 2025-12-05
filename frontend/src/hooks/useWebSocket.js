import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useWebSocket(rooms = []) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Join specified rooms
      if (rooms.includes('admin')) {
        socket.emit('join-admin-room');
      }
      rooms.forEach((room) => {
        if (room.startsWith('form-')) {
          const formId = room.replace('form-', '');
          socket.emit('join-form-room', formId);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('new-submission', (data) => {
      console.log('New submission received:', data);
      setLastMessage({ type: 'new-submission', data });
    });

    socket.on('validation-update', (data) => {
      console.log('Validation update received:', data);
      setLastMessage({ type: 'validation-update', data });
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Only run on mount/unmount

  // Rejoin rooms when they change
  useEffect(() => {
    if (socketRef.current && isConnected) {
      rooms.forEach((room) => {
        if (room.startsWith('form-')) {
          const formId = room.replace('form-', '');
          socketRef.current.emit('join-form-room', formId);
        }
      });
    }
  }, [rooms, isConnected]);

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    isConnected,
    lastMessage,
    emit,
  };
}

