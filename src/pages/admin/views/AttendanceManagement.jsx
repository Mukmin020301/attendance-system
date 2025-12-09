import React, { useEffect, useState } from 'react';
import { getAllAttendance, getAllUsers } from '../../../firebase/firestore';
import { getSettings } from '../../../firebase/settings';
import { analyzeDailyAttendance } from '../../../utils/attendanceUtils';
import Button from '../../../components/Button';

const AttendanceManagement = () => {
    const [dailySummaries, setDailySummaries] = useState([]);
    const [users, setUsers] = useState({});
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [staffSearch, setStaffSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users
            const usersList = await getAllUsers();
            const userMap = {};
            usersList.forEach(u => userMap[u.id] = u);
            setUsers(userMap);

            // 2. Fetch Settings for Rules
            const settings = await getSettings();
            const timeRules = settings?.timeRules || null;

            // 3. Fetch Attendance
            const logs = await getAllAttendance(startDate || null, endDate || null);

            // 4. Group by User + Date
            // key: "uid_date" -> [logs]
            const groupedLogs = {};
            logs.forEach(log => {
                const key = `${log.uid}_${log.date}`;
                if (!groupedLogs[key]) groupedLogs[key] = [];
                groupedLogs[key].push(log);
            });

            // 5. Analyze each group
            const summaries = Object.keys(groupedLogs).map(key => {
                const group = groupedLogs[key];
                const uid = group[0].uid;
                const date = group[0].date;
                const analysis = analyzeDailyAttendance(group, timeRules);

                // Find In and Out times for display
                const firstIn = group.find(l => l.type === 'in');
                const lastOut = [...group].reverse().find(l => l.type === 'out');

                return {
                    id: key,
                    uid,
                    date,
                    userName: userMap[uid]?.name || 'Unknown',
                    userRole: userMap[uid]?.role || 'N/A',
                    clockIn: firstIn ? new Date(firstIn.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                    clockOut: lastOut ? new Date(lastOut.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
                    status: analysis.status,
                    statusColor: analysis.color,
                    tags: analysis.tags,
                    warnings: analysis.warnings,
                    location: firstIn?.location ? `${firstIn.location.latitude.toFixed(4)}, ...` : '-'
                };
            });

            // Sort by date desc
            summaries.sort((a, b) => new Date(b.date) - new Date(a.date));

            setDailySummaries(summaries);

        } catch (error) {
            console.error("Error in AttendanceView:", error);
        }
        setLoading(false);
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    const filteredSummaries = dailySummaries.filter(s =>
        s.userName.toLowerCase().includes(staffSearch.toLowerCase())
    );

    const exportCSV = () => {
        const headers = ["Date", "Name", "Role", "Clock In", "Clock Out", "Status", "Tags", "Warnings"];
        const rows = filteredSummaries.map(s => [
            s.date,
            s.userName,
            s.userRole,
            s.clockIn,
            s.clockOut,
            s.status,
            s.tags.join('; '),
            s.warnings.join('; ')
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `attendance_summary_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="view-container">
            <h2>Attendance Management</h2>

            <form className="controls-section" onSubmit={handleFilterSubmit} style={{ alignItems: 'flex-end' }}>
                <div className="filter-group">
                    <label>Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label>End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label>Staff Name</label>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={staffSearch}
                        onChange={e => setStaffSearch(e.target.value)}
                    />
                </div>
                <Button type="submit">Refresh/Filter</Button>
                <div style={{ flex: 1 }}></div>
                <Button type="button" onClick={exportCSV} style={{ background: '#28a745' }}>Export Report</Button>
            </form>

            <div className="card-panel">
                {loading ? <p>Loading data...</p> : (
                    <div className="logs-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Staff Name</th>
                                    <th>Clock In</th>
                                    <th>Clock Out</th>
                                    <th>Status</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSummaries.length > 0 ? (
                                    filteredSummaries.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.date}</td>
                                            <td>
                                                <strong>{item.userName}</strong>
                                                <div style={{ fontSize: '0.8em', color: '#666' }}>{item.userRole}</div>
                                            </td>
                                            <td>{item.clockIn}</td>
                                            <td>{item.clockOut}</td>
                                            <td>
                                                <span className={`badge`} style={{
                                                    backgroundColor: item.statusColor === 'green' ? '#e6f7ed' :
                                                        item.statusColor === 'orange' ? '#fff3cd' :
                                                            item.statusColor === 'blue' ? '#e7f5ff' : '#fbecec',
                                                    color: item.statusColor === 'green' ? '#0d8a4e' :
                                                        item.statusColor === 'orange' ? '#856404' :
                                                            item.statusColor === 'blue' ? '#004085' : '#d93025'
                                                }}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>
                                                {item.tags.map(t => (
                                                    <span key={t} style={{ marginRight: '5px', fontSize: '0.75rem', border: '1px solid #ccc', padding: '2px 5px', borderRadius: '4px' }}>
                                                        {t}
                                                    </span>
                                                ))}
                                                {item.warnings.map(w => (
                                                    <span key={w} style={{ color: 'red', fontSize: '0.75rem', fontWeight: 'bold', display: 'block' }}>
                                                        ! {w}
                                                    </span>
                                                ))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                            No records found for these filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceManagement;
