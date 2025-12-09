# Attendance System

A comprehensive web-based attendance tracking system built with **React** and **Firebase**. This system enables employees to clock in/out using GPS validation and allows administrators to manage users, attendance logs, and leave requests.

## 🚀 Features

### Staff Dashboard
- **GPS Attendance**: Clock in and out with location validation.
- **Geofencing**: Ensures staff are within the allowed office radius.
- **One Punch Rule**: Enforces a strict "Start Shift -> End Shift" daily flow.
- **Leave Management**: Apply for Annual, Sick, or Emergency leave.
- **Activity Log**: View daily attendance history and leave status.

### Admin Dashboard
- **Overview**: High-level stats and daily activity summaries.
- **User Management**: Create, edit, and deactivate user accounts.
- **Attendance Monitoring**: View and filter master attendance logs by date and user.
- **Leave Approvals**: Review and approve/reject leave applications.
- **System Settings**: Configure Office Location (Latitude/Longitude) and Geofence Radius.

## 🛠️ Technology Stack
- **Frontend**: React.js (v19)
- **Backend**: Firebase Authentication, Cloud Firestore
- **Routing**: React Router (v7)
- **Maps**: Leaflet & React-Leaflet
- **Styling**: Modular CSS

## 📋 Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase Account & Project

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Mukmin020301/attendance-system.git
    cd attendance-system/attendance-web
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Firebase Configuration**
    - Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    - Enable **Authentication** (Email/Password).
    - Enable **Cloud Firestore** (Start in Test Mode).
    - Update `src/firebase/firebaseConfig.js` with your project keys.

4.  **Run Locally**
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📝 Usage

### Default Roles
The system auto-assigns the `staff` role to new users. You can manually update a user's role to `admin` in the Firestore `users` collection.

### Deployment
To deploy to Firebase Hosting:
```bash
npm run build
firebase deploy
```

## 📄 License
[MIT](LICENSE)
