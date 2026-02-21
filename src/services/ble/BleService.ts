import {
  BleManager,
  Device,
  State,
  ScanMode,
  BleError,
  Characteristic,
} from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// Singleton BLE Manager instance
class BLEService {
  private manager: BleManager;
  private static instance: BLEService;

  private constructor() {
    this.manager = new BleManager();
  }

  public static getInstance(): BLEService {
    if (!BLEService.instance) {
      BLEService.instance = new BLEService();
    }
    return BLEService.instance;
  }

  // Request Android permissions for BLE
  async requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      // Android < 12
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    }
  }

  // Check Bluetooth state
  async checkBluetoothState(): Promise<State> {
    return await this.manager.state();
  }

  // Listen to Bluetooth state changes
  onStateChange(callback: (state: State) => void): () => void {
    const subscription = this.manager.onStateChange(callback, true);
    return () => subscription.remove();
  }

  // Start scanning for BLE devices
  startScanning(
    serviceUUIDs: string[] | null,
    onDeviceFound: (error: BleError | null, device: Device | null) => void,
    scanMode: ScanMode = ScanMode.LowLatency,
  ): void {
    this.manager.startDeviceScan(
      serviceUUIDs,
      { allowDuplicates: false, scanMode },
      onDeviceFound,
    );
  }

  // Stop scanning
  stopScanning(): void {
    this.manager.stopDeviceScan();
  }

  // Connect to a device
  async connectToDevice(deviceId: string): Promise<Device> {
    const device = await this.manager.connectToDevice(deviceId, {
      requestMTU: 512,
      autoConnect: false,
    });
    await device.discoverAllServicesAndCharacteristics();
    return device;
  }

  // Disconnect from device
  async disconnectFromDevice(deviceId: string): Promise<void> {
    await this.manager.cancelDeviceConnection(deviceId);
  }

  // Check if device is connected
  async isDeviceConnected(deviceId: string): Promise<boolean> {
    return await this.manager.isDeviceConnected(deviceId);
  }

  // Read characteristic
  async readCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
  ): Promise<Characteristic> {
    return await this.manager.readCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
    );
  }

  // Write characteristic
  async writeCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    value: string, // Base64 encoded
  ): Promise<Characteristic> {
    return await this.manager.writeCharacteristicWithResponseForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
      value,
    );
  }

  // Monitor characteristic (notifications)
  monitorCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    onValueChange: (
      error: BleError | null,
      characteristic: Characteristic | null,
    ) => void,
  ): () => void {
    const subscription = this.manager.monitorCharacteristicForDevice(
      deviceId,
      serviceUUID,
      characteristicUUID,
      onValueChange,
    );
    return () => subscription.remove();
  }

  // Get services for connected device
  async getServicesForDevice(deviceId: string) {
    return await this.manager.servicesForDevice(deviceId);
  }

  // Destroy manager (cleanup)
  destroy(): void {
    this.manager.destroy();
  }
}

export const bleService = BLEService.getInstance();
export default BLEService;
