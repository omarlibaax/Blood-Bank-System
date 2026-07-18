import React, { useEffect, useState } from 'react';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiLockPasswordLine,
  RiSearchLine,
} from 'react-icons/ri';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Staff');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load users. Administrator access required.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
      if (res.data.length > 0) setRole(res.data[0].name);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole(roles[0]?.name || 'Staff');
    setStatus(true);
    setNewPassword('');
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (u) => {
    setCurrentUser(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setPhone(u.phone || '');
    setRole(u.role);
    setStatus(u.status);
    setError('');
    setShowEditModal(true);
  };

  const handleOpenPassword = (u) => {
    setCurrentUser(u);
    setNewPassword('');
    setError('');
    setShowPasswordModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', { fullName, username, email, phone, password, role });
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${currentUser.id}`, { fullName, email, phone, role, status });
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await api.post(`/users/${currentUser.id}/reset-password`, { newPassword });
      setShowPasswordModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user account permanently?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && u.status) ||
      (statusFilter === 'inactive' && !u.status);
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create and manage system accounts and roles"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'User Management' }]}
        actions={
          <button type="button" onClick={handleOpenAdd} className="btn-primary">
            <RiAddLine size={16} /> Add User
          </button>
        }
      />

      {error && !showAddModal && !showEditModal && !showPasswordModal && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <RiSearchLine className="search-icon" size={16} />
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : (
          <div className="nowa-table-container">
            <table className="nowa-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="text-center">No users found.</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.fullName}</strong></td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td><span className="badge info">{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.status ? 'success' : 'danger'}`}>
                          {u.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{u.createdAt ? u.createdAt.substring(0, 10) : '—'}</td>
                      <td>
                        <div className="action-btn-group">
                          <button type="button" onClick={() => handleOpenEdit(u)} className="icon-btn" title="Edit">
                            <RiEditLine size={16} />
                          </button>
                          <button type="button" onClick={() => handleOpenPassword(u)} className="icon-btn" title="Reset password">
                            <RiLockPasswordLine size={16} />
                          </button>
                          <button type="button" onClick={() => handleDelete(u.id)} className="icon-btn danger" title="Delete">
                            <RiDeleteBinLine size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Add User</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleAdd}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} required>
                    {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Edit User — {currentUser?.username}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} required>
                    {roles.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Account Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value === 'true')}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-sm">
            <div className="modal-header">
              <h2>Reset Password — {currentUser?.username}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowPasswordModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password *</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
