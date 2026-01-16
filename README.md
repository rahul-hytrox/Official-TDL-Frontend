# TDL-Portal Dashboard (Frontend) 💻

A high-performance, premium administrative and employee dashboard built with **Angular 19**. This portal provides real-time visualization of attendance, break patterns, and payroll metrics.

[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ECharts](https://img.shields.io/badge/ECharts-AA344D?style=for-the-badge&logo=apacheecharts&logoColor=white)](https://echarts.apache.org/)

---

## 🎨 Design Aesthetics
- **Premium Dark Theme**: High-contrast analytics section with glassmorphism effects.
- **Dynamic Charts**: Powered by Apache ECharts for real-time trend analysis.
- **Responsive Layout**: Optimized for Desktop, Tablet, and Mobile views.
- **Micro-interactions**: Smooth transitions and hover effects for a premium feel.

---

## 🚀 Installation & Build

### 1. Prerequisites
- **Node.js** (v18.19.0 or higher recommended)
- **Angular CLI** (`npm install -g @angular/cli`)

### 2. Setup
```bash
# Navigate to the portal directory
cd TDL-Portal

# Install dependencies
npm install
```

### 3. Configuration
The portal uses environment files for API connectivity.
- Update `src/environments/environment.development.ts` for local testing.
- Default API URL: `http://localhost:5000/api`

### 4. Running Locally
```bash
# Start development server
npm start
```
The application will be available at `http://localhost:4200`.

### 5. Production Build
```bash
# Build for deployment
npm run build
```
The output will be in the `dist/tdl-portal` folder.

---

## 🏗️ Core Architecture

### **Components Overview**
- **Dashboard**: Central hub with attendance counters, shift activity feeds, and interactive analytics filters.
- **Employee Report**: Comprehensive payroll table with PDF export functionality (Landscape A4).
- **Leave System**: Clean interface for requesting leaves and tracking approval status.
- **Auth**: Secure login screens with JWT token management.

### **Features Implemented**
- **Integrated Break Sync**: Subtracts Lunch/Tea breaks from shift duration in real-time.
- **Historical Analysis**: Users can select previous months/years to view historical performance graphs.
- **Live Attendance Status**: Visual indicators for Login, Break, and Logoff states.
- **PDF Engine**: Custom HTML-to-PDF generation for official attendance records.

---

## 🤝 Community & Collaboration
This frontend is part of the Open Source initiative. We follow and collaborate with developers globally.

**Maintainer:** [rahul-hytrox](https://github.com/rahul-hytrox)

**Collaboration Rules:**
1. Maintain consistent coding standards (TypeScript/Angular 19).
2. Ensure UI responsiveness before PR submission.
3. Don't touch the core `styles.css` without discussion.

Built with ❤️ by the Attendance Project Batch.
