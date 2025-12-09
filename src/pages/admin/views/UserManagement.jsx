import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserStatus } from '../../../firebase/firestore';
import Button from '../../../components/Button';
import { registerUserInSecondaryApp } from '../../../firebase/auth'; // Import from auth
import { doc, setDoc } from 'firebase/firestore'; // Import firestore functions
import { db } from '../../../firebase/firebaseConfig'; // Import db instance

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('staff');
    const [newDepartment, setNewDepartment] = useState('');
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [formError, setFormError] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
        }
        setLoading(false);
    };

    const handleToggleStatus = async (uid, currentStatus) => {
        const newStatus = currentStatus === false ? true : false;
        if (window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`)) {
            await updateUserStatus(uid, newStatus);
            fetchUsers();
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormError('');
        setAdding(true);

        try {
            // 1. Create Auth User
            const user = await registerUserInSecondaryApp(newEmail, newPassword);

            // 2. Create Firestore Document
            await setDoc(doc(db, "users", user.uid), {
                name: newName,
                email: newEmail,
                phone: newPhone,
                department: newDepartment,
                jobTitle: newJobTitle,
                role: newRole,
                createdAt: new Date(),
                isActive: true
            });

            alert('User created successfully!');
            setShowAddModal(false);
            // Reset form
            setNewName(''); setNewEmail(''); setNewPassword(''); setNewPhone('');
            fetchUsers(); // Refresh list

        } catch (err) {
            console.error("Add user error:", err);
            let message = "Failed to create user.";
            if (err.code === 'auth/email-already-in-use') {
                message = "This email address is already registered.";
            } else if (err.code === 'auth/invalid-email') {
                message = "Invalid email address format.";
            } else if (err.code === 'auth/weak-password') {
                message = "Password should be at least 6 characters.";
            } else {
                message = err.message;
            }
            setFormError(message);
        }
        setAdding(false);
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="view-container">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>User Management</h2>
                <Button onClick={() => setShowAddModal(true)}>+ Add New User</Button>
            </div>

            <div className="controls-section">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ width: '300px' }}
                    />
                </div>
                <Button onClick={fetchUsers} variant="secondary" style={{ marginLeft: '10px' }}>Refresh List</Button>
            </div>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {/* Modal for Adding User */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h3>Add New Staff Member</h3>
                        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Temporary Password</label>
                                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="Min 6 chars" />
                            </div>
                            <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Role</label>
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Department</label>
                                    <select value={newDepartment} onChange={e => setNewDepartment(e.target.value)}>
                                        <option value="">Select Dept</option>
                                        <option value="HR">HR</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Operations">Operations</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Job Title</label>
                                <input type="text" value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                            </div>

                            {formError && <p className="error-message">{formError}</p>}

                            <div className="modal-actions" style={{ marginTop: '10px' }}>
                                <Button type="submit" disabled={adding}>{adding ? 'Creating...' : 'Create User'}</Button>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel" style={{ marginLeft: '10px' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card-panel">
                {loading ? <p>Loading users...</p> : (
                    <div className="logs-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.name || 'N/A'}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`badge ${user.role === 'admin' ? 'badge-in' : 'badge-out'}`}
                                                    style={user.role === 'staff' ? { backgroundColor: '#e3f2fd', color: '#0d47a1' } : {}}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.isActive !== false ? 'badge-in' : 'badge-out'}`}>
                                                    {user.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                    style={{
                                                        padding: '5px 10px',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ccc',
                                                        background: 'white'
                                                    }}
                                                >
                                                    {user.isActive !== false ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                            No users found.
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

export default UserManagement;
