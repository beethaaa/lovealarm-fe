import { useCallback, useEffect, useRef } from 'react';
import { State } from 'react-native-ble-plx';
import { bleService } from '@services/ble/BleService';
import { useBleStore } from '@store/bleStore';

const SCAN_TIMEOUT_MS = 10000; // 10 seconds

export const useBLE = () => {
  const {
    bluetoothState,
    setBluetoothState,
    hasPermissions,
    setHasPermissions,
    isScanning,
    setIsScanning,
    devices,
    addOrUpdateDevice,
    clearDevices,
    connectedDeviceId,
    setConnectedDeviceId,
    updateDeviceConnection,
    setError,
  } = useBleStore();

  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen to Bluetooth state changes
  useEffect(() => {
    const unsubscribe = bleService.onStateChange(state => {
      setBluetoothState(state);
    });
    return unsubscribe;
  }, [setBluetoothState]);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await bleService.requestAndroidPermissions();
      setHasPermissions(granted);
      return granted;
    } catch (error: any) {
      setError(error?.message || 'Failed to request permissions');
      return false;
    }
  }, [setHasPermissions, setError]);

  // Start scanning
  const startScan = useCallback(
    async (serviceUUIDs: string[] | null = null) => {
      try {
        // Check permissions first
        if (!hasPermissions) {
          const granted = await requestPermissions();
          if (!granted) {
            setError('Bluetooth permissions not granted');
            return;
          }
        }

        // Check Bluetooth state
        const state = await bleService.checkBluetoothState();
        if (state !== State.PoweredOn) {
          setError('Bluetooth is not powered on');
          return;
        }

        clearDevices();
        setIsScanning(true);
        setError(null);

        bleService.startScanning(serviceUUIDs, (error, device) => {
          if (error) {
            setError(error.message);
            setIsScanning(false);
            return;
          }
          if (device) {
            addOrUpdateDevice(device);
          }
        });

        // Auto stop after timeout
        scanTimeoutRef.current = setTimeout(() => {
          stopScan();
        }, SCAN_TIMEOUT_MS);
      } catch (error: any) {
        setError(error?.message || 'Failed to start scanning');
        setIsScanning(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermissions],
  );

  // Stop scanning
  const stopScan = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    bleService.stopScanning();
    setIsScanning(false);
  }, [setIsScanning]);

  // Connect to device
  const connectToDevice = useCallback(
    async (deviceId: string): Promise<boolean> => {
      try {
        setError(null);
        stopScan();
        await bleService.connectToDevice(deviceId);
        updateDeviceConnection(deviceId, true);
        setConnectedDeviceId(deviceId);
        return true;
      } catch (error: any) {
        setError(error?.message || 'Failed to connect');
        return false;
      }
    },
    [stopScan, updateDeviceConnection, setConnectedDeviceId, setError],
  );

  // Disconnect from device
  const disconnectFromDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      try {
        await bleService.disconnectFromDevice(deviceId);
        updateDeviceConnection(deviceId, false);
        setConnectedDeviceId(null);
      } catch (error: any) {
        setError(error?.message || 'Failed to disconnect');
      }
    },
    [updateDeviceConnection, setConnectedDeviceId, setError],
  );

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      bleService.stopScanning();
    };
  }, []);

  return {
    bluetoothState,
    hasPermissions,
    isScanning,
    devices,
    connectedDeviceId,
    requestPermissions,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
  };
};
