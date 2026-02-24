import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import axios from 'axios';

const { LoveAlarmAdvertiser } = NativeModules;

const SERVICE_UUID = 'B1E43993-27FD-4361-9BCC-12F26EE6B5F4';
const SERVER_URL = 'https://lovealarm-be-sp9u.onrender.com/api';

const manager = new BleManager();
let nearbyUsers = {};
let isScanning = false;

async function requestBlePermissions() {
  if (Platform.OS !== 'android') return;

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);

  console.log('BLE Permissions:', granted);
}

export const startLoveAlarm = async bleSessionUuid => {
  await requestBlePermissions();

  console.log('Starting Love Alarm for:', bleSessionUuid);

  manager.onStateChange(async state => {
    console.log('BLE STATE:', state);

    if (state === 'PoweredOn' && !isScanning) {
      isScanning = true;

      // START ADVERTISE
      try {
        LoveAlarmAdvertiser.startAdvertising(bleSessionUuid);
        console.log('Advertising started');

        await axios.post(
          `${SERVER_URL}/ble-session`,
          {
            bleUuid: bleSessionUuid,
            platform: 'android',
          },
          {
            headers: {
              Authorization:
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OThlZDVhNzA5YTk1MjZmN2JhNThkZmYiLCJlbWFpbCI6ImhvdXNlbGlseTAxMEBnbWFpbC5jb20iLCJyb2xlS2V5IjoyLCJpYXQiOjE3NzE5MTA1NDIsImV4cCI6MTc3MTkxNDE0Mn0.UEV6Or-Ns43I8s5-7qPymoPaQEHJOdyuCqPRRN4XRXE',
            },
          },
        );
      } catch (e) {
        console.log('Advertising error:', e);
      }

      console.log('Starting scan...');

      manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: true },
        (error, device) => {
          if (error) {
            console.log('Scan error:', error);
            return;
          }

          if (device?.manufacturerData) {
            const buffer = Buffer.from(device.manufacturerData, 'base64');
            const foundbleSessionUuid = buffer.toString('utf8');

            nearbyUsers[foundbleSessionUuid] = {
              bleSessionUuid: foundbleSessionUuid,
              rssi: device.rssi,
              lastSeen: Date.now(),
            };

            console.log(
              'Found user:',
              foundbleSessionUuid,
              'RSSI:',
              device.rssi,
            );
          }
        },
      );
    }
  }, true);

  setInterval(async () => {
    const now = Date.now();
    const active = Object.values(nearbyUsers).filter(
      u => now - u.lastSeen < 5000,
    );

    if (active.length > 0) {
      try {
        const res = await axios.post(
          `${SERVER_URL}/suggest-friends`,
          {
            bleUuids: active,
          },
          {
            headers: {
              Authorization:
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OThlZDVhNzA5YTk1MjZmN2JhNThkZmYiLCJlbWFpbCI6ImhvdXNlbGlseTAxMEBnbWFpbC5jb20iLCJyb2xlS2V5IjoyLCJpYXQiOjE3NzE5MTA1NDIsImV4cCI6MTc3MTkxNDE0Mn0.UEV6Or-Ns43I8s5-7qPymoPaQEHJOdyuCqPRRN4XRXE',
            },
          },
        );
        console.log('Sent to server:', active);
        console.log(res);
      } catch (e) {
        console.log('Server error:', e);
      }
    }
  }, 3000);
};
