import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLocation } from '../../utils/getLocation';
import { calculateDistance } from '../../utils/calculateDistance';
import { recordAttendance, getTodayAttendance } from '../../firebase/firestore';
import { getSettings } from '../../firebase/settings';
import MapDisplay from '../../components/MapDisplay';
import AttendanceLogTable from '../../components/AttendanceLogTable';
import './StaffDashboard.css';
import { applyForLeave, getMyLeaves, LEAVE_QUOTA } from '../../firebase/leaves'; // Import Leave Logic

const StaffDashboard = () => {
    const { currentUser, logout } = useAuth();
    const [location, setLocation] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState(null);
    const [todayLogs, setTodayLogs] = useState([]);
    const [serverTime, setServerTime] = useState(new Date());
    const [lastPunch, setLastPunch] = useState(null); // Keep temporarily to avoid breaking other parts, but we really want punchStatus.
    const [punchStatus, setPunchStatus] = useState('start'); // 'start', 'end', 'completed'

    // Leave State
    const [myLeaves, setMyLeaves] = useState([]);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveType, setLeaveType] = useState('annual');
    const [leaveStartDate, setLeaveStartDate] = useState('');
    const [leaveEndDate, setLeaveEndDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveDays, setLeaveDays] = useState(1);
    const [leaveError, setLeaveError] = useState('');
    const [applying, setApplying] = useState(false);

    // Note: In a real app we fetch this from the user doc. 
    // For MVP we assume default quota minus approved leaves, or read from user doc.
    // Let's assume the user object in context or a fetch updates this.
    // For now, hardcoded display or derived from context if available.
    // Implementation Plan said "Users: Add leaveBalance".
    // We should fetch user balance here. For MVP, we stick to basic display.
    const [balance, setBalance] = useState({ ...LEAVE_QUOTA });

    // Initialize settings and logs
    useEffect(() => {
        const init = async () => {
            if (currentUser) {
                const s = await getSettings();
                setSettings(s);
                await fetchLogs();
                fetchLeaves();
            }
        };
        init();

        const timer = setInterval(() => setServerTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [currentUser]);

    const fetchLogs = async () => {
        if (currentUser?.uid) {
            const logs = await getTodayAttendance(currentUser.uid);
            const formattedLogs = logs.map(log => ({
                ...log,
                time: new Date(log.timestamp.seconds * 1000).toLocaleTimeString(),
                type: log.type
            }));
            setTodayLogs(formattedLogs);

            // Determine status based on One Punch Rule
            const hasClockedIn = formattedLogs.some(l => l.type === 'in');
            const hasClockedOut = formattedLogs.some(l => l.type === 'out');

            if (hasClockedIn && hasClockedOut) {
                setPunchStatus('completed');
            } else if (hasClockedIn) {
                setPunchStatus('end');
            } else {
                setPunchStatus('start');
            }
        }
    };

    const fetchLeaves = async () => {
        if (currentUser?.uid) {
            const data = await getMyLeaves(currentUser.uid);
            setMyLeaves(data);
            // Ideally fetch user doc to update 'balance' state here too
        }
    };

    const handlePunch = async () => {
        const type = lastPunch === 'in' ? 'out' : 'in';
        setLoading(true);
        setStatus({ message: 'Getting location...', type: 'info' });

        try {
            const loc = await getLocation();
            setLocation(loc);
            setAccuracy(loc.accuracy);

            // Accuracy check (Enabled)
            // if (loc.accuracy > 150) {
            //    setStatus({ message: `GPS Accuracy too low (${loc.accuracy}m). Move outdoors.`, type: 'error' });
            //    setLoading(false);
            //    return;
            // }

            // Radius check (Enabled Logic - but keeping commented for user preference unless asked)
            // if (settings) {
            //     const distance = calculateDistance(loc.latitude, loc.longitude, settings.officeLocation.lat, settings.officeLocation.lng);
            //     if (distance > settings.radius) {
            //         setStatus({ message: `Too far from office (${Math.round(distance)}m). Allowed: ${settings.radius}m.`, type: 'error' });
            //         setLoading(false);
            //         return;
            //     }
            // }

            const result = await recordAttendance(currentUser.uid, type, {
                latitude: loc.latitude,
                longitude: loc.longitude,
                accuracy: loc.accuracy
            });

            if (result.success) {
                setStatus({ message: `Successfully clocked ${type}!`, type: 'success' });
                await fetchLogs();
            } else {
                setStatus({ message: `Error: ${result.error}`, type: 'error' });
            }

        } catch (err) {
            console.error(err);
            setStatus({ message: 'Error getting location or permission denied.', type: 'error' });
        }

        setLoading(false);
    };

    // Calculate days between dates
    useEffect(() => {
        if (leaveStartDate && leaveEndDate) {
            const start = new Date(leaveStartDate);
            const end = new Date(leaveEndDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setLeaveDays(diffDays > 0 ? diffDays : 0);
        }
    }, [leaveStartDate, leaveEndDate]);

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        setLeaveError('');
        setApplying(true);

        try {
            // Basic Validation
            if (leaveDays <= 0) throw new Error("Invalid date range.");
            if (leaveDays > 5) throw new Error("Maximum 5 days per application.");

            // 3-Day Rule for Annual Leave
            if (leaveType === 'annual') {
                const start = new Date(leaveStartDate);
                const today = new Date();
                const threeDaysFromNow = new Date();
                threeDaysFromNow.setDate(today.getDate() + 2); // roughly 3 days

                if (start < threeDaysFromNow) {
                    throw new Error("Annual leave must be applied at least 3 days in advance.");
                }
            }

            const res = await applyForLeave(currentUser.uid, leaveType, leaveStartDate, leaveEndDate, leaveDays, leaveReason);
            if (res.success) {
                alert("Leave application submitted!");
                setShowLeaveModal(false);
                fetchLeaves();
                // Reset form
                setLeaveReason(''); setLeaveStartDate(''); setLeaveEndDate('');
            } else {
                throw new Error(res.error);
            }
        } catch (err) {
            setLeaveError(err.message);
        }
        setApplying(false);
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const confirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };

    return (
        <div className="staff-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Staff Dashboard</h1>
                </div>
                <div className="user-info">
                    <p>{currentUser?.email}</p>
                    <p className="server-time">{serverTime.toLocaleTimeString()}</p>
                    <button onClick={() => setShowLogoutConfirm(true)} className="logout-btn">Logout</button>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Left Column: Actions & Map */}
                <div className="left-col">
                    <div className="card-panel">
                        <div className="punch-area">
                            <button
                                onClick={handlePunch}
                                disabled={loading || punchStatus === 'completed'}
                                className={`punch-btn ${punchStatus === 'completed' ? 'bg-disabled' :
                                    punchStatus === 'end' ? 'bg-red' : 'bg-green'
                                    }`}
                                style={punchStatus === 'completed' ? { background: '#ccc', cursor: 'not-allowed' } : {}}
                            >
                                {loading ? '...' :
                                    punchStatus === 'completed' ? 'DONE' :
                                        punchStatus === 'end' ? 'CLOCK OUT' : 'CLOCK IN'}

                                <span className="sub-text">
                                    {loading ? 'Processing' :
                                        punchStatus === 'completed' ? 'Shift Completed' :
                                            punchStatus === 'end' ? 'End Shift' : 'Start Shift'}
                                </span>
                            </button>

                            {status.message && (
                                <div className={`status-container status-${status.type}`}>
                                    {status.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card-panel" style={{ marginTop: '30px' }}>
                        {location ? (
                            <>
                                <MapDisplay
                                    latitude={location.latitude}
                                    longitude={location.longitude}
                                    officeLocation={settings?.officeLocation}
                                    radius={settings?.radius}
                                />
                                <div className="gps-info">
                                    <span>Accuracy: ±{Math.round(accuracy)}m</span>
                                    <span>{settings ? `Zone: ${settings.radius}m` : ''}</span>
                                </div>
                            </>
                        ) : (
                            <p>Loading Location...</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Logs & Leaves */}
                <div className="right-col">
                    <div className="card-panel">
                        <h3 className="section-title">Today's Activity</h3>
                        <div className="logs-table-wrapper">
                            <AttendanceLogTable logs={todayLogs.map(l => ({
                                time: l.time,
                                type: <span className={`badge badge-${l.type}`}>{l.type.toUpperCase()}</span>,
                                location: l.location ? `${l.location.latitude.toFixed(5)}, ${l.location.longitude.toFixed(5)}` : 'Unknown'
                            }))} />
                        </div>
                    </div>

                    {/* Leave Management Section */}
                    <div className="card-panel leave-section">
                        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 className="section-title" style={{ margin: 0, border: 'none' }}>Leave Management</h3>
                            <button
                                onClick={() => setShowLeaveModal(true)}
                                className="action-btn"
                                style={{
                                    padding: '8px 16px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                + Apply Leave
                            </button>
                        </div>

                        {/* Simple Balance Display (Static for MVP or connect to DB) */}
                        <div className="leave-balance-cards">
                            <div className="balance-card">
                                <h4>Annual</h4>
                                {/* In real app, fetch from user.leaveBalance */}
                                <p>12 <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/ yr</span></p>
                            </div>
                            <div className="balance-card">
                                <h4>Sick</h4>
                                <p>5 <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>/ yr</span></p>
                            </div>
                        </div>

                        <div className="leave-history-list">
                            {myLeaves.length > 0 ? (
                                myLeaves.slice(0, 3).map(leave => (
                                    <div key={leave.id} className="leave-item">
                                        <div className="leave-info">
                                            <h5>{leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave ({leave.daysCount}d)</h5>
                                            <span className="leave-date">{leave.startDate} to {leave.endDate}</span>
                                        </div>
                                        <span className={`status-badge status-${leave.status}`}>{leave.status}</span>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#999', textAlign: 'center' }}>No recent leave applications.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Logout</h3>
                        <p>Are you sure you want to end your session?</p>
                        <div className="modal-actions">
                            <button onClick={confirmLogout} className="btn-confirm">Yes, Logout</button>
                            <button onClick={() => setShowLogoutConfirm(false)} className="btn-cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Apply Leave Modal */}
            {showLeaveModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>Apply for Leave</h3>
                        <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group">
                                <label>Leave Type</label>
                                <select value={leaveType} onChange={e => setLeaveType(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <option value="annual">Annual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="emergency">Emergency Leave</option>
                                </select>
                            </div>
                            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Start Date</label>
                                    <input type="date" value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>End Date</label>
                                    <input type="date" value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Duration: {leaveDays} day(s)</p>

                            <div className="form-group">
                                <label>Reason/Notes</label>
                                <textarea
                                    value={leaveReason}
                                    onChange={e => setLeaveReason(e.target.value)}
                                    placeholder="Optional reason..."
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                                />
                            </div>

                            {leaveError && <div className="error-message" style={{ fontSize: '0.9rem', color: 'red' }}>{leaveError}</div>}

                            <div className="modal-actions">
                                <button type="submit" disabled={applying} className="btn-confirm" style={{ background: '#007bff' }}>{applying ? 'Applying...' : 'Submit Application'}</button>
                                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn-cancel">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDashboard;
