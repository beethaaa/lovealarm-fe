import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '@/constants/service';
import { useAppStore } from '@/store/appStore';

console.log('[SocketContext.tsx] File loaded at:', new Date().toLocaleTimeString());

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data: any, callback?: (res: any) => void) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emit: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAppStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {    
    if (isLoggedIn && user) {
      console.log('[SocketProvider] User details:', JSON.stringify(user));
      const userId = user._id || user.id || user.userId || user.data?._id || user.data?.id;
      
      if (!userId) {
        console.warn('[SocketProvider] User is logged in but no userId was found in:', JSON.stringify(user));
        return;
      }

      console.log('[SocketProvider] Connecting with userId:', userId);
      const newSocket = io(SERVER_URL, {
        auth: {
          userId: userId.toString(),
        },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('love-request:send', (data: any) => {
        console.log('Received love request:', data);
        const { addLoveRequest, setNotification } = useAppStore.getState();
        addLoveRequest(data);
        setNotification(data.message || 'Someone has a crush on you!');
      
        setTimeout(() => {
          useAppStore.getState().setNotification(null);
        }, 5000);
      });

      newSocket.on('love-request:accepted', (data: any) => {
        console.log('Love request accepted by partner:', data);
        const { setNotification } = useAppStore.getState();
        setNotification(`${data.partnerName} đã chấp nhận tín hiệu của bạn!`);
        setTimeout(() => setNotification(null), 5000);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
      setIsConnected(false);
      return undefined;
    }
  }, [isLoggedIn, user]);

  const emit = (event: string, data: any, callback?: (res: any) => void) => {
    console.log(`[Socket] Emitting event: ${event}`, JSON.stringify(data));
    if (socket) {
      socket.emit(event, data, callback);
    } else {
      console.warn(`[Socket] Cannot emit ${event} - socket is null/disconnected`);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit }}>
      {children}
    </SocketContext.Provider>
  );
};
