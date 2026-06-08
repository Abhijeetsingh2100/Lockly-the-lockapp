import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory fallback for development when native module is missing
const memoryStorage = new Map<string, string>();
let isNativeStorageFailing = false;

export const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isNativeStorageFailing) {
      return memoryStorage.get(key) || null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('Native storage failed, falling back to memory storage. You need to rebuild your dev client.');
      isNativeStorageFailing = true;
      return memoryStorage.get(key) || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isNativeStorageFailing) {
      memoryStorage.set(key, value);
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('Native storage failed, falling back to memory storage. You need to rebuild your dev client.');
      isNativeStorageFailing = true;
      memoryStorage.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isNativeStorageFailing) {
      memoryStorage.delete(key);
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      isNativeStorageFailing = true;
      memoryStorage.delete(key);
    }
  }
};

export const AppStorage = {
  async getLockedApps(): Promise<any[]> {
    const data = await SafeStorage.getItem('locked_apps');
    return data ? JSON.parse(data) : [];
  },

  async saveLockedApps(apps: any[]): Promise<void> {
    await SafeStorage.setItem('locked_apps', JSON.stringify(apps));
  },

  async getAppPermissions(appId: string): Promise<any> {
    const data = await SafeStorage.getItem(`perms_${appId}`);
    // Default permissions when an app is first opened in Control Panel
    return data ? JSON.parse(data) : {
      wifi: true,
      bluetooth: true,
      camera: true,
      microphone: true,
      location: true,
    };
  },

  async saveAppPermissions(appId: string, permissions: any): Promise<void> {
    await SafeStorage.setItem(`perms_${appId}`, JSON.stringify(permissions));
  }
};
