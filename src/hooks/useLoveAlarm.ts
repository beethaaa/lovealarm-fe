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
  return token;
};

export interface LoveAlarmUser {
  bleSessionUuid: string;
  rssi: number;
  lastSeen: number;
}

export interface ScanResult extends LoveAlarmUser {
  name: string;
  interests: string[];
  userId: string;
  avatarUrl: string;
  gender: number;
}

const manager = new BleManager();

export const useLoveAlarm = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<ScanResult[]>([]);
  const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
  const [sessionUuid, setSessionUuid] = useState<string | null>(null);

  const bleMapRef = useRef<Record<string, LoveAlarmUser>>({});
  const isScanningRef = useRef(false);

  useEffect(() => {
    const subscription = manager.onStateChange(state => {
      setBluetoothState(state);
    }, true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

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
    setNearbyUsers([]);

    try {
      if (LoveAlarmAdvertiser && (await getToken())) {
        LoveAlarmAdvertiser.startAdvertising(bleSessionUuid);
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
    } catch (e) {
      console.error('Advertising/Session error:', e);
    }

    manager.startDeviceScan(
      [SERVICE_UUID],
      { allowDuplicates: true },
      (error, device) => {
        if (error) {
          console.error('Error', error);
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

            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(foundbleSessionUuid)) return;
            if (
              foundbleSessionUuid.toLowerCase() === bleSessionUuid.toLowerCase()
            ) {
              return;
            }

            bleMapRef.current[foundbleSessionUuid] = {
              bleSessionUuid: foundbleSessionUuid,
              rssi: device.rssi ?? -100,
              lastSeen: Date.now(),
            };
          } catch (err) {
            console.error('Parse error:', err);
          }
        }
      },
    );
  }, []);

  const stopLoveAlarm = useCallback(async () => {
    manager.stopDeviceScan();
    setIsScanning(false);
    setNearbyUsers([]);
    bleMapRef.current = {};

    if (LoveAlarmAdvertiser) {
      try {
        await LoveAlarmAdvertiser.stopAdvertising();
      } catch (error) {
        console.error('Failed to stop advertising', error);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isScanningRef.current) return;

      const now = Date.now();
      Object.keys(bleMapRef.current).forEach(key => {
        if (now - bleMapRef.current[key].lastSeen >= 5000) {
          delete bleMapRef.current[key];
        }
      });

      const active = Object.values(bleMapRef.current);

      if (active.length === 0) {
        setNearbyUsers([]);
        return;
      }

      try {
        const res = await axios.post(
          `${SERVER_URL}/api/suggest-friends`,
          { bleUuids: active.map(u => u.bleSessionUuid) },
          { headers: { Authorization: `Bearer ${await getToken()}` } },
        );
        const mergedUsers = res.data.users?.map((user: any) => {
          const bleData = bleMapRef.current[user.bleUuid];
          return {
            ...user,
            // Ensure these properties exist from LoveAlarmUser
            bleSessionUuid: user.bleUuid || user.bleSessionUuid,
            rssi: bleData?.rssi ?? -100,
            lastSeen: bleData?.lastSeen ?? Date.now(),
          } as ScanResult;
        });
        setNearbyUsers(mergedUsers);
      } catch (e) {
        console.error('Server error sync users:', e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return {
    isScanning,
    nearbyUsers,
    bluetoothState,
    sessionUuid,
    startLoveAlarm,
    stopLoveAlarm,
  };
};
