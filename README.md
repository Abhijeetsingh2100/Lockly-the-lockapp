# 🔒 Lockly

A modern Android Device Access Control and Application Management platform built with React Native and Expo Development Build.

Lockly helps organizations control application access, manage device permissions, and create secure experiences on dedicated Android devices, shared workplace devices, and kiosk deployments.

---

## 📱 Overview

Lockly is designed for businesses that require controlled access to applications and device capabilities on Android devices.

The platform provides a simple and intuitive interface for managing application access through PIN and biometric authentication while offering centralized permission controls for device resources such as Wi-Fi, Bluetooth, Location, Camera, and Microphone.

Lockly is ideal for kiosk environments, enterprise deployments, educational institutions, retail devices, and shared workstations.

---

## ✨ Features

### 🔐 Application Access Control

* PIN-based Authentication
* Biometric Authentication
* Application Lock Management
* Secure Access Verification

### 📲 Application Management

* View Installed Applications
* Enable or Disable Protection
* Search Applications
* Application Status Monitoring

### ⚙️ Permission Management

Control application access to:

* Wi-Fi
* Bluetooth
* Location
* Camera
* Microphone
* Storage

### 🏢 Enterprise & Kiosk Support

* Dedicated Device Workflows
* Shared Device Environments
* Simplified User Access
* Enterprise-Friendly Interface

### 🎨 Modern User Experience

* Material Design Inspired UI
* Dark Mode Support
* Responsive Layout
* Clean Navigation Structure

---

## 🎯 Use Cases

### Enterprise Devices

Manage application access on company-owned Android devices.

### Kiosk Systems

Provide controlled application access on kiosk deployments.

### Retail & POS

Secure business-critical applications on retail devices.

### Educational Institutions

Restrict access to approved applications on shared devices.

### Shared Workplace Devices

Protect sensitive applications in multi-user environments.

---

## 🛠️ Technology Stack

### Frontend

* React Native
* Expo Development Build
* TypeScript

### State Management

* Zustand

### Navigation

* Expo Router

### Authentication

* Expo Local Authentication
* Android Biometric APIs

### Storage

* MMKV
* Secure Local Storage

### Native Integration

* Android Permission APIs
* Device Capability Management

---

## 📂 Project Structure

```text
lockly/
│
├── app/
│   ├── (tabs)/
│   ├── permissions/
│   ├── settings/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── cards/
│   ├── forms/
│   └── navigation/
│
├── hooks/
│
├── services/
│   ├── authentication/
│   ├── permissions/
│   ├── applications/
│   └── storage/
│
├── store/
│
├── assets/
│
└── utils/
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js
* Android Studio
* Android SDK
* Expo CLI
* Java Development Kit (JDK)

---

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/lockly.git
cd lockly
```

---

### Install Dependencies

```bash
npm install
```

---

### Start Development Server

```bash
npx expo start
```

---

### Run Android Development Build

```bash
npx expo run:android
```

---

## 📸 Application Screens

### Lock Screen

Secure application access using PIN or biometric authentication.

### Home Dashboard

Manage protected applications and device access.

### Permissions Center

Control access to device resources for managed applications.

### Settings

Configure security preferences, biometrics, and application behavior.

---

## 🔐 Security

Lockly follows security-first development principles:

* Secure local storage
* Biometric authentication support
* Protected access workflows
* Permission-based controls
* Minimal required permissions

No sensitive credentials are stored in plain text.

---

## 🗺️ Roadmap

### Version 1.0

* App Access Control
* PIN Authentication
* Biometric Authentication
* Permission Management
* Dark Mode

### Version 1.5

* Activity Logs
* Enhanced Access Policies
* Device Profiles

### Version 2.0

* Multi-Device Management
* Cloud Synchronization
* Admin Dashboard
* Enterprise Policy Management

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to your branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Abhijeet Singh**

GitHub: https://github.com/Abhijeetsingh2100

---

## ⭐ Support

If you found this project useful, consider giving it a star on GitHub. It helps support future development and improvements.
