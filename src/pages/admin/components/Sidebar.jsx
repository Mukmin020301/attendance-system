import React from 'react';
import './Sidebar.css';
import dashboardIcon from '../../../assets/icons/dashboard-report-icon.svg';
import usersIcon from '../../../assets/icons/business-team-icon.svg';
import attendanceIcon from '../../../assets/icons/reservation-completed-icon.svg';
import settingsIcon from '../../../assets/icons/settings-line-icon.svg';
import logoutIcon from '../../../assets/icons/logout-icon.svg';
import leaveIcon from '../../../assets/icons/exit-door-icon.svg';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <img src={dashboardIcon} alt="Dashboard" className="sidebar-icon-img" /> },
        { id: 'users', label: 'User Management', icon: <img src={usersIcon} alt="Users" className="sidebar-icon-img" /> },
        { id: 'attendance', label: 'Attendance', icon: <img src={attendanceIcon} alt="Attendance" className="sidebar-icon-img" /> },
        { id: 'leaves', label: 'Leave Requests', icon: <img src={leaveIcon} alt="Leaves" className="sidebar-icon-img" /> },
        { id: 'settings', label: 'Settings', icon: <img src={settingsIcon} alt="Settings" className="sidebar-icon-img" /> },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Admin</h2>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button onClick={onLogout} className="nav-item logout">
                    <span className="icon"><img src={logoutIcon} alt="Logout" className="sidebar-icon-img" /></span>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
