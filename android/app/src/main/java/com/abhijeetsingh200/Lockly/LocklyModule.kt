package com.abhijeetsingh200.Lockly

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.pm.PackageManager
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

    @ReactMethod
    fun requestDeviceAdmin(promise: Promise) {
        val componentName = ComponentName(reactApplicationContext, LocklyDeviceAdminReceiver::class.java)
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Activate device administrator to prevent Lockly from being uninstalled.")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
        promise.resolve(true)
    }

    @ReactMethod
    fun removeDeviceAdmin(promise: Promise) {
        val dpm = reactApplicationContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val componentName = ComponentName(reactApplicationContext, LocklyDeviceAdminReceiver::class.java)
        dpm.removeActiveAdmin(componentName)
        promise.resolve(true)
    }

    @ReactMethod
    fun isDeviceAdminEnabled(promise: Promise) {
        val dpm = reactApplicationContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val componentName = ComponentName(reactApplicationContext, LocklyDeviceAdminReceiver::class.java)
        promise.resolve(dpm.isAdminActive(componentName))
    }

    @ReactMethod
    fun setUninstallProtection(isEnabled: Boolean, promise: Promise) {
        val sharedPref = reactApplicationContext.getSharedPreferences("LocklyPrefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("app_uninstall_protection", if (isEnabled) "true" else "false")
            apply()
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(reactApplicationContext)) {
                val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:" + reactApplicationContext.packageName))
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun changeAppIcon(aliasName: String, promise: Promise) {
        val pm = reactApplicationContext.packageManager
        val packageName = reactApplicationContext.packageName
        
        val aliases = listOf(
            "$packageName.MainActivity",
            "$packageName.CalculatorAlias",
            "$packageName.WeatherAlias",
            "$packageName.NotesAlias",
            "$packageName.ClockAlias",
            "$packageName.CalendarAlias"
        )
        
        val targetAlias = if (aliasName == "Lockly") "$packageName.MainActivity" else "$packageName.${aliasName}Alias"
        
        for (alias in aliases) {
            val componentName = ComponentName(packageName, alias)
            val state = if (alias == targetAlias) {
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            } else {
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            }
            try {
                pm.setComponentEnabledSetting(
                    componentName,
                    state,
                    PackageManager.DONT_KILL_APP
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        promise.resolve(true)
    }
}
