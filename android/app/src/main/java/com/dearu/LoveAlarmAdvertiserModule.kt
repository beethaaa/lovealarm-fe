package com.dearu

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import com.facebook.react.bridge.*
import java.util.*
import android.util.Log

class LoveAlarmAdvertiserModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var advertiser: BluetoothLeAdvertiser? = null
    private var advertiseCallback: AdvertiseCallback? = null

    private val TAG = "LOVE_ALARM"

    override fun getName(): String {
        return "LoveAlarmAdvertiser"
    }

    @ReactMethod
    fun startAdvertising(userId: String) {
        Log.d(TAG, "==============================")
        Log.d(TAG, "Start advertising called")
        Log.d(TAG, "UserId: $userId")

        val bluetoothManager =
            reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager

        val bluetoothAdapter = bluetoothManager.adapter

        if (bluetoothAdapter == null) {
            Log.e(TAG, "BluetoothAdapter is NULL")
            return
        }

        if (!bluetoothAdapter.isEnabled) {
            Log.e(TAG, "Bluetooth is NOT enabled")
            return
        }

        Log.d(TAG, "Bluetooth is enabled")

        advertiser = bluetoothAdapter.bluetoothLeAdvertiser

        if (advertiser == null) {
            Log.e(TAG, "BluetoothLeAdvertiser is NULL (device may not support BLE advertise)")
            return
        }

        Log.d(TAG, "BluetoothLeAdvertiser ready")

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build()

        val uuidString = "00001920-0000-1000-8000-00805f9b34fb"
        val serviceUuid = ParcelUuid(UUID.fromString(uuidString))

        Log.d(TAG, "Service UUID: $uuidString")

        val uuid = try {
            UUID.fromString(userId)
        } catch (e: Exception) {
            Log.e(TAG, "Invalid UUID: $userId")
            return
        }
        val bb = java.nio.ByteBuffer.wrap(ByteArray(16))
        bb.putLong(uuid.mostSignificantBits)
        bb.putLong(uuid.leastSignificantBits)
        val manufacturerBytes = bb.array()

        Log.d(TAG, "Manufacturer data length: ${manufacturerBytes.size}")
        Log.d(TAG, "Manufacturer data (hex): ${
            manufacturerBytes.joinToString(" ") { "%02X".format(it) }
        }")

        val data = AdvertiseData.Builder()
            .addServiceUuid(serviceUuid)
            .addManufacturerData(
                0x1920,
                manufacturerBytes
            )
            .setIncludeDeviceName(false)
            .build()

        advertiseCallback = object : AdvertiseCallback() {

            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                super.onStartSuccess(settingsInEffect)
                Log.d(TAG, "✅ Advertise START SUCCESS")
            }

            override fun onStartFailure(errorCode: Int) {
                super.onStartFailure(errorCode)
                Log.e(TAG, "❌ Advertise FAILED with errorCode: $errorCode")

                when (errorCode) {
                    ADVERTISE_FAILED_ALREADY_STARTED ->
                        Log.e(TAG, "Reason: Already started")

                    ADVERTISE_FAILED_DATA_TOO_LARGE ->
                        Log.e(TAG, "Reason: Data too large")

                    ADVERTISE_FAILED_FEATURE_UNSUPPORTED ->
                        Log.e(TAG, "Reason: Feature unsupported")

                    ADVERTISE_FAILED_INTERNAL_ERROR ->
                        Log.e(TAG, "Reason: Internal error")

                    ADVERTISE_FAILED_TOO_MANY_ADVERTISERS ->
                        Log.e(TAG, "Reason: Too many advertisers")
                }
            }
        }

        advertiser?.startAdvertising(settings, data, advertiseCallback)

        Log.d(TAG, "startAdvertising() invoked")
        Log.d(TAG, "==============================")
    }

    @ReactMethod
    fun stopAdvertising() {
        Log.d(TAG, "Stop advertising called")

        advertiser?.let {
            advertiseCallback?.let { callback ->
                it.stopAdvertising(callback)
                Log.d(TAG, "Advertising stopped")
            }
        }
    }
}
