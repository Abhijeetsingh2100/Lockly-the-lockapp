package com.abhijeetsingh200.Lockly

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class LocklyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "LocklyModule"
    }

    @ReactMethod
    fun updateLockedApps(appsJson: String, promise: Promise) {
        val sharedPref = reactApplicationContext.getSharedPreferences("LocklyPrefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("locked_apps_json", appsJson)
            apply()
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun setUnlockedApp(pkgName: String, promise: Promise) {
        val sharedPref = reactApplicationContext.getSharedPreferences("LocklyPrefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("temp_unlocked_pkg", pkgName)
            apply()
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun openAppInfoSettings(promise: Promise) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
        val uri = android.net.Uri.fromParts("package", reactApplicationContext.packageName, null)
        intent.data = uri
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun checkAccessibilityPermission(promise: Promise) {
        var isAccessibilityEnabled = 0
        val service = "com.abhijeetsingh200.Lockly/com.abhijeetsingh200.Lockly.AppWatcherService"
        try {
            isAccessibilityEnabled = Settings.Secure.getInt(
                reactApplicationContext.contentResolver,
                android.provider.Settings.Secure.ACCESSIBILITY_ENABLED
            )
        } catch (e: Settings.SettingNotFoundException) {
            e.printStackTrace()
        }
        val mStringColonSplitter = android.text.TextUtils.SimpleStringSplitter(':')
        if (isAccessibilityEnabled == 1) {
            val settingValue = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            if (settingValue != null) {
                mStringColonSplitter.setString(settingValue)
                while (mStringColonSplitter.hasNext()) {
                    val accessibilityService = mStringColonSplitter.next()
                    if (accessibilityService.equals(service, ignoreCase = true)) {
                        promise.resolve(true)
                        return
                    }
                }
            }
        }
        promise.resolve(false)
    }

    @ReactMethod
    fun setAutoLockDelay(delayInMs: Double, promise: Promise) {
        val sharedPref = reactApplicationContext.getSharedPreferences("LocklyPrefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putLong("autolock_delay_ms", delayInMs.toLong())
            apply()
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun goToHome(promise: Promise) {
        val intent = Intent(Intent.ACTION_MAIN)
        intent.addCategory(Intent.CATEGORY_HOME)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
    }
}
