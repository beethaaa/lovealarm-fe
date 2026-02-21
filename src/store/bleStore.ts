import { create } from 'zustand';
import { Device, State } from 'react-native-ble-plx';

export interface BleDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isConnectable: boolean | null;
  isConnected: boolean;
  serviceUUIDs: string[] | null;
  lastSeen: Date;
}

interface BleState {
  // Bluetooth state
  bluetoothState: State;
  setBluetoothState: (state: State) => void;

  // Permissions
  hasPermissions: boolean;
  setHasPermissions: (granted: boolean) => void;

  // Scanning
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;

  // Devices
  devices: BleDevice[];
  addOrUpdateDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  clearDevices: () => void;
  updateDeviceConnection: (deviceId: string, isConnected: boolean) => void;

  // Connected device
  connectedDeviceId: string | null;
  setConnectedDeviceId: (id: string | null) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;
}

export const useBleStore = create<BleState>(set => ({
  bluetoothState: State.Unknown,
  setBluetoothState: (state: State) => set({ bluetoothState: state }),

  hasPermissions: false,
  setHasPermissions: (granted: boolean) => set({ hasPermissions: granted }),

  isScanning: false,
  setIsScanning: (scanning: boolean) => set({ isScanning: scanning }),

  devices: [],
  addOrUpdateDevice: (device: Device) =>
    set(state => {
      const existingIndex = state.devices.findIndex(d => d.id === device.id);
      const bleDevice: BleDevice = {
        id: device.id,
        name: device.name || device.localName || null,
        rssi: device.rssi,
        isConnectable: device.isConnectable,
        isConnected: false,
        serviceUUIDs: device.serviceUUIDs,
        lastSeen: new Date(),
      };
      if (existingIndex >= 0) {
        const updated = [...state.devices];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...bleDevice,
          isConnected: updated[existingIndex].isConnected,
        };
        return { devices: updated };
      }
      return { devices: [...state.devices, bleDevice] };
    }),
  removeDevice: (deviceId: string) =>
    set(state => ({
      devices: state.devices.filter(d => d.id !== deviceId),
    })),
  clearDevices: () => set({ devices: [] }),
  updateDeviceConnection: (deviceId: string, isConnected: boolean) =>
    set(state => ({
      devices: state.devices.map(d =>
        d.id === deviceId ? { ...d, isConnected } : d,
      ),
    })),

  connectedDeviceId: null,
  setConnectedDeviceId: (id: string | null) => set({ connectedDeviceId: id }),

  error: null,
  setError: (error: string | null) => set({ error }),
}));
