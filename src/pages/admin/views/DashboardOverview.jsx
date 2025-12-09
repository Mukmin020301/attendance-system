import React, { useState, useEffect } from 'react';
import { getAllUsers, getAllAttendance } from '../../../firebase/firestore';

const DashboardOverview = () => {
    const [stats, setStats] = useState({
        totalStaff: 0,
        presentToday: 0,
        activeNow: 0
    });
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Fetch Users
                const users = await getAllUsers();
                const totalStaff = users.filter(u => u.role !== 'admin').length;

                // Create a map of UID -> Name for quick lookup
                const userMap = {};
                users.forEach(u => userMap[u.id] = u.name);

                // Fetch Today's Attendance for Stats
                const today = new Date().toISOString().split('T')[0];
                const attendanceToday = await getAllAttendance(today);

                // Fetch Recent Global Attendance (Last 10)
                const allRecent = await getAllAttendance();
                const recentWithNames = allRecent.slice(0, 10).map(log => ({
                    ...log,
                    userName: userMap[log.uid] || 'Unknown User',
                    time: log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'N/A',
                    date: log.date
                }));

                // Calculate unique users present today
                const uniquePresent = new Set(attendanceToday.map(log => log.uid)).size;

                setStats({
                    totalStaff,
                    presentToday: uniquePresent,
                    activeNow: users.filter(u => u.isActive).length
                });
                setRecentLogs(recentWithNames);

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="view-container">
            <h2>Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="card-panel stat-card">
                    <h3>Total Staff</h3>
                    <p className="stat-number">{loading ? '-' : stats.totalStaff}</p>
                    <p className="stat-detail">Registered Employees</p>
                </div>
                <div className="card-panel stat-card">
                    <h3>Present Today</h3>
                    <p className="stat-number">{loading ? '-' : stats.presentToday}</p>
                    <p className="stat-detail">Clocked In at least once</p>
                </div>
                <div className="card-panel stat-card">
                    <h3>Active Accounts</h3>
                    <p className="stat-number">{loading ? '-' : stats.activeNow}</p>
                    <p className="stat-detail">System Access Enabled</p>
                </div>
            </div>

            <div className="dashboard-columns" style={{ marginTop: '30px' }}>

                {/* Recent Activity Feed */}
                <div className="card-panel">
                    <h3>Recent Activity</h3>
                    {loading ? <p>Loading...</p> : (
                        <div className="activity-feed">
                            {recentLogs.length > 0 ? (
                                <table className="simple-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                            <th style={{ padding: '8px' }}>User</th>
                                            <th style={{ padding: '8px' }}>Type</th>
                                            <th style={{ padding: '8px' }}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLogs.map(log => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '8px' }}>{log.userName}</td>
                                                <td style={{ padding: '8px' }}>
                                                    <span className={`badge badge-${log.type}`}>{log.type?.toUpperCase()}</span>
                                                </td>
                                                <td style={{ padding: '8px', fontSize: '0.9em', color: '#666' }}>
                                                    {log.date === new Date().toISOString().split('T')[0] ? 'Today' : log.date} {log.time}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No recent activity.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
