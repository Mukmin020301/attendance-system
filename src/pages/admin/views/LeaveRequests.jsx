import React, { useEffect, useState } from 'react';
import { getAllLeaves, updateLeaveStatus } from '../../../firebase/leaves';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/Button';
import './LeaveRequests.css'; // We'll create this CSS next

const LeaveRequests = () => {
    const { currentUser } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const fetchLeaves = async () => {
        setLoading(true);
        const data = await getAllLeaves(filter === 'all' ? null : filter);
        setLeaves(data);
        setLoading(false);
    };

    const handleAction = async (leaveid, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;

        setProcessingId(leaveid);
        const res = await updateLeaveStatus(leaveid, status, currentUser.uid);

        if (res.success) {
            // Optimistic update or refetch
            setLeaves(prev => prev.filter(l => l.id !== leaveid)); // Remove from list if viewing pending
            // If viewing all, we might want to update the item instead
            if (filter !== 'pending') {
                fetchLeaves();
            }
        } else {
            alert("Error: " + res.error);
        }
        setProcessingId(null);
    };

    return (
        <div className="leave-requests-view">
            <div className="view-header">
                <h2>Leave Requests</h2>
                <div className="filter-tabs">
                    <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
                    <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>Approved</button>
                    <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>Rejected</button>
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All History</button>
                </div>
            </div>

            {loading ? (
                <p>Loading requests...</p>
            ) : (
                <div className="requests-list">
                    {leaves.length === 0 ? (
                        <p className="no-data">No {filter} leave requests found.</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Staff</th>
                                    <th>Type</th>
                                    <th>Dates</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Applied</th>
                                    <th>Status</th>
                                    {filter === 'pending' && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(leave => (
                                    <tr key={leave.id}>
                                        <td>
                                            <div className="user-cell">
                                                <span className="user-name">{leave.userName || 'Unknown'}</span>
                                                <span className="user-email">{leave.userEmail}</span>
                                            </div>
                                        </td>
                                        <td><span className="badge-type">{leave.type}</span></td>
                                        <td>{leave.startDate} to {leave.endDate}</td>
                                        <td>{leave.daysCount}</td>
                                        <td className="reason-cell">{leave.reason || '-'}</td>
                                        <td>{leave.appliedAt?.seconds ? new Date(leave.appliedAt.seconds * 1000).toLocaleDateString() : 'Just now'}</td>
                                        <td>
                                            <span className={`status-badge status-${leave.status}`}>{leave.status}</span>
                                        </td>
                                        {filter === 'pending' && (
                                            <td className="actions-cell">
                                                <button
                                                    className="btn-approve"
                                                    onClick={() => handleAction(leave.id, 'approved')}
                                                    disabled={processingId === leave.id}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => handleAction(leave.id, 'rejected')}
                                                    disabled={processingId === leave.id}
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default LeaveRequests;
