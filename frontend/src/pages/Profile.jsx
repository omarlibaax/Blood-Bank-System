import React, { useEffect, useState } from 'react';
import { RiUserLine, RiMailLine, RiPhoneLine, RiShieldKeyholeLine, RiLockPasswordLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PageHeader from '../components/PageHeader';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/users/me');
        setProfile((prev) => ({ ...prev, ...response.data, roles: response.data.role ? [response.data.role] : prev?.roles }));
      } catch {
        // Fall back to auth context data when profile fetch fails.
      }
    };
    loadProfile();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword,
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const displayUser = profile || user;

  const profileFields = [
    { icon: RiUserLine, label: 'Username', value: displayUser?.username },
    { icon: RiMailLine, label: 'Email', value: displayUser?.email },
    { icon: RiPhoneLine, label: 'Phone', value: displayUser?.phone },
    { icon: RiShieldKeyholeLine, label: 'Role', value: displayUser?.roles?.[0] || displayUser?.role || 'Staff' },
  ];

  return (
    <div>
      <PageHeader
        title="User Profile"
        subtitle="Manage your account and security settings"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Profile' }]}
      />

      <div className="dashboard-layout-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card profile-card">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
            alt=""
            className="profile-avatar"
          />
          <h2 className="profile-name">{displayUser?.fullName || displayUser?.username || 'User'}</h2>
          <span className="profile-role">{displayUser?.roles?.[0] || displayUser?.role || 'Blood Bank Staff'}</span>

          <div className="profile-fields">
            {profileFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="profile-field">
                  <Icon size={16} className="profile-field-icon" />
                  <div>
                    <div className="profile-field-label">{field.label}</div>
                    <div className="profile-field-value">{field.value || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="card-section-title" style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <RiLockPasswordLine size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Security & Password
          </h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
