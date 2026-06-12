package com.abhijeetsingh200.Lockly

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.content.Intent
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

class AppWatcherService : AccessibilityService() {

    private var lockedAppsCache: List<String> = emptyList()
    private var controlPanelDisabledApps: List<String> = emptyList()
    private var lastCheckedTime: Long = 0
    private var currentForegroundApp: String = ""
    private var unlockedApp: String = ""
    private var unlockedAppBackgroundTime: Long = 0
    private var autoLockDelayMs: Long = 0
    private var isUninstallProtectionEnabled: Boolean = false

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Update cache every 3 seconds to avoid constant disk reads
        val now = System.currentTimeMillis()
        if (now - lastCheckedTime > 3000) {
            refreshLockedApps()
            lastCheckedTime = now
        }

        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            // Check if there is a pending unlocked app from the React Native UI
            val sharedPref = getSharedPreferences("LocklyPrefs", Context.MODE_PRIVATE)
            val tempUnlocked = sharedPref.getString("temp_unlocked_pkg", "")
            if (!tempUnlocked.isNullOrEmpty()) {
                unlockedApp = tempUnlocked
                sharedPref.edit().remove("temp_unlocked_pkg").apply()
            }

            // Handle control panel blocking
            if (packageName == "com.android.systemui") {
                if (controlPanelDisabledApps.contains(currentForegroundApp)) {
                    Log.d("Lockly", "Blocking Control Panel for $currentForegroundApp")
                    performGlobalAction(GLOBAL_ACTION_BACK)
                }
                return
            }

            if (packageName != "com.abhijeetsingh200.Lockly" && packageName != "com.android.systemui") {
                if (currentForegroundApp != packageName) {
                    // We switched apps!
                    if (currentForegroundApp == unlockedApp) {
                        unlockedAppBackgroundTime = System.currentTimeMillis()
                    }
                    
                    if (packageName == unlockedApp) {
                        // Coming back to unlocked app
                        if (autoLockDelayMs == 0L || (System.currentTimeMillis() - unlockedAppBackgroundTime > autoLockDelayMs)) {
                            unlockedApp = "" // Lock it!
                        }
                    }
                    currentForegroundApp = packageName
                }
            }

            if (lockedAppsCache.contains(packageName) && packageName != "com.abhijeetsingh200.Lockly") {
                val className = event.className?.toString() ?: ""
                
                // Allow Wi-Fi connection dialogs/panels to bypass the lock
                if (packageName == "com.android.settings" && (
                    className.contains("SettingsPanelActivity") || 
                    className.contains("WifiDialogActivity") ||
                    className.contains("bottomsheet") ||
                    className.contains("DeviceAdminAdd")
                )) {
                    return
                }

                if (packageName == unlockedApp) {
                    return // Still unlocked, do nothing
                }
                
                // It's a locked app! Lock it!
                launchLockScreen(packageName)
            } else if (isUninstallProtectionEnabled && (packageName == "com.google.android.packageinstaller" || packageName == "com.android.packageinstaller")) {
                val className = event.className?.toString() ?: ""
                if (className.contains("Uninstall") || className.contains("PackageInstallerActivity") || className.contains("UninstallerActivity")) {
                    if (packageName != unlockedApp) {
                        launchLockScreen(packageName)
                    }
                }
            }
        }
    }

    private fun launchLockScreen(lockedPackage: String) {
        val t = System.currentTimeMillis()
        val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("lockly:///locked?pkg=$lockedPackage&t=$t"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        startActivity(intent)
    }

    private fun refreshLockedApps() {
        try {
            val sharedPref = getSharedPreferences("LocklyPrefs", Context.MODE_PRIVATE)
            autoLockDelayMs = sharedPref.getLong("autolock_delay_ms", 0L)
            isUninstallProtectionEnabled = sharedPref.getString("app_uninstall_protection", "false") == "true"
            val jsonString = sharedPref.getString("locked_apps_json", "[]")
            if (jsonString == null) return
            
            val array = JSONArray(jsonString)
            
            val newLocked = mutableListOf<String>()
            val newDisabledCP = mutableListOf<String>()
            
            for (i in 0 until array.length()) {
                val appObj = array.getJSONObject(i)
                val isProtected = appObj.optBoolean("isProtected", false)
                val pkgName = appObj.optString("packageName", "")
                val appId = appObj.optString("id", "")
                
                if (isProtected && pkgName.isNotEmpty()) {
                    newLocked.add(pkgName)
                    
                    // Check if disableControlPanel is true for this app
                    val permsStr = sharedPref.getString("perms_$appId", "{}")
                    val permsObj = JSONObject(permsStr)
                    if (permsObj.optBoolean("disableControlPanel", false)) {
                        newDisabledCP.add(pkgName)
                    }
                }
            }
            lockedAppsCache = newLocked
            controlPanelDisabledApps = newDisabledCP
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onInterrupt() {
        // Do nothing
    }
}
