import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './components/Sidebar';
import DashboardOverview from './views/DashboardOverview';
import UserManagement from './views/UserManagement';
import AttendanceManagement from './views/AttendanceManagement';
import LeaveRequests from './views/LeaveRequests';
import SettingsView from './views/SettingsView';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardOverview setActiveTab={setActiveTab} />;
            case 'users': return <UserManagement />;
            case 'attendance': return <AttendanceManagement />;
            case 'leaves': return <LeaveRequests />;
            case 'settings': return <SettingsView />;
            default: return <DashboardOverview />;
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
            <main className="admin-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;
