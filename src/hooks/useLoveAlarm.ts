import { useState, useEffect, useCallback, useRef } from 'react';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import axios from 'axios';
import { SERVER_URL, SERVICE_UUID } from '@/constants/service';
import generateUUID from '@/utils/uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { LoveAlarmAdvertiser } = NativeModules;

const getToken = async () => {
  const token = await AsyncStorage.getItem('token');
  console.log('Token:', token);
  return token;
};

export interface LoveAlarmUser {
  bleSessionUuid: string;
  rssi: number;
  lastSeen: number;
}

const manager = new BleManager();

export const useLoveAlarm = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<Record<string, LoveAlarmUser>>(
    {},
  );
  const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
  const [sessionUuid, setSessionUuid] = useState<string | null>(null);

  const nearbyUsersRef = useRef<Record<string, LoveAlarmUser>>({});
  const isScanningRef = useRef(false);

  useEffect(() => {
    const subscription = manager.onStateChange(state => {
      setBluetoothState(state);
    }, true);
    return () => subscription.remove();
  }, []);

  // Update ref to avoid stale closures in setInterval
  useEffect(() => {
    nearbyUsersRef.current = nearbyUsers;
    isScanningRef.current = isScanning;
  }, [nearbyUsers, isScanning]);

  const requestBlePermissions = async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === 'granted'
    );
  };

  const startLoveAlarm = useCallback(async () => {
    const hasPermission = await requestBlePermissions();
    if (!hasPermission) {
      console.warn('BLE permissions not granted');
      return;
    }

    const state = await manager.state();
    if (state !== State.PoweredOn) {
      console.warn('Bluetooth is not powered on');
      return;
    }

    const bleSessionUuid = generateUUID();
    setSessionUuid(bleSessionUuid);
    setIsScanning(true);
    setNearbyUsers({});

    try {
      if (LoveAlarmAdvertiser && (await getToken())) {
        LoveAlarmAdvertiser.startAdvertising(bleSessionUuid);
        console.log('Advertising started:', bleSessionUuid);
      } else {
        console.warn('LoveAlarmAdvertiser native module not linked');
      }

      await axios.post(
        `${SERVER_URL}/api/ble-session`,
        {
          bleUuid: bleSessionUuid,
          platform: Platform.OS,
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      console.log('Session registered with Backend');
    } catch (e) {
      console.log('Advertising/Session error:', e);
    }

    console.log('Starting scan...');
    manager.startDeviceScan(
      [SERVICE_UUID],
      { allowDuplicates: true },
      (error, device) => {
        console.log('Device found:', device);

        if (error) {
          console.log('Error', error);
          return;
        }

        if (device?.manufacturerData) {
          try {
            const buffer = Buffer.from(device.manufacturerData, 'base64');
            let uuidBuf;

            if (buffer.length >= 18) {
              const mfgIdLE = buffer[0] + buffer[1] * 256;
              const mfgIdBE = buffer[1] + buffer[0] * 256;
              if (mfgIdLE !== 0x1920 && mfgIdBE !== 0x1920) return;
              uuidBuf = buffer.slice(2, 18);
            } else if (buffer.length === 16) {
              uuidBuf = buffer;
            } else {
              return; 
            }

            const hex = uuidBuf.toString('hex');
            const foundbleSessionUuid = `${hex.substring(0, 8)}-${hex.substring(
              8,
              12,
            )}-${hex.substring(12, 16)}-${hex.substring(
              16,
              20,
            )}-${hex.substring(20)}`;

            // Ignore external devices with invalid UUID format
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(foundbleSessionUuid)) return;

            // Ignore our own device returning in the scan
            if (
              foundbleSessionUuid.toLowerCase() === bleSessionUuid.toLowerCase()
            ) {
              return;
            }

            setNearbyUsers(prev => ({
              ...prev,
              [foundbleSessionUuid]: {
                bleSessionUuid: foundbleSessionUuid,
                rssi: device.rssi || -100,
                lastSeen: Date.now(),
              },
            }));
          } catch (err) {
            console.log('Parse error:', err);
          }
        }
      },
    );

    console.log('hi');
  }, []);

  const stopLoveAlarm = useCallback(async () => {
    manager.stopDeviceScan();
    setIsScanning(false);

    if (LoveAlarmAdvertiser) {
      try {
        await LoveAlarmAdvertiser.stopAdvertising();
        console.log('Advertising stopped');
      } catch (error) {
        console.log('Failed to stop advertising', error);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isScanningRef.current) return;

      const now = Date.now();
      const active = Object.values(nearbyUsersRef.current).filter(
        u => now - u.lastSeen < 5000,
      );

      const updatedUsers = { ...nearbyUsersRef.current };
      let stateChanged = false;
      Object.keys(updatedUsers).forEach(key => {
        if (now - updatedUsers[key].lastSeen >= 5000) {
          delete updatedUsers[key];
          stateChanged = true;
        }
      });
      if (stateChanged) {
        setNearbyUsers(updatedUsers);
      }

      if (active.length > 0) {
        try {
          await axios.post(
            `${SERVER_URL}/api/suggest-friends`,
            {
              bleUuids: active.map(u => u.bleSessionUuid),
            },
            {
              headers: {
                Authorization: `Bearer ${await getToken()}`,
              },
            },
          );
          console.log('Sent to server:', active.length, 'users');
        } catch (e) {
          console.log('Server error sync users:', e);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return {
    isScanning,
    nearbyUsers: Object.values(nearbyUsers),
    bluetoothState,
    sessionUuid,
    startLoveAlarm,
    stopLoveAlarm,
  };
};
