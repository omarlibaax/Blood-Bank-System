import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiUserHeartLine,
  RiDropLine,
  RiFileList3Line,
  RiHospitalLine,
  RiCalendarEventLine,
  RiHeartPulseLine,
  RiAddLine,
  RiArrowRightSLine,
  RiAlertLine,
  RiCheckboxCircleLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching dashboard statistics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(true), 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const groupDistribution = stats.groupDistribution || {};
  const maxStockVal = Math.max(...BLOOD_GROUPS.map((g) => Number(groupDistribution[g] || 0)), 1);
  const healthPercent = stats.inventoryHealthPercent || 0;
  const displayName = user?.fullName || user?.username || 'User';

  const quickActions = [
    { label: 'Add Donor', icon: RiUserHeartLine, to: '/donors', color: '#01b8b8' },
    { label: 'Record Donation', icon: RiHeartPulseLine, to: '/donations', color: '#e53e3e' },
    { label: 'New Request', icon: RiFileList3Line, to: '/requests', color: '#3182ce' },
    { label: 'Schedule Slot', icon: RiCalendarEventLine, to: '/appointments', color: '#dd6b20' },
  ];

  return (
    <div className="dashboard-view-container">
      <PageHeader
        title="Dashboard"
        subtitle="Blood bank operations overview"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }]}
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        }
      />

      <div className="dashboard-content">
        {/* Welcome + Quick Actions Row */}
        <div className="dashboard-layout-row">
          <div className="dashboard-left-stack">
            <div className="card welcome-banner-card">
              <div className="welcome-info">
                <h1>
                  Hi, Welcome Back <span>{displayName}!</span>
                </h1>
                <p>
                  Inventory health is at <strong>{healthPercent}%</strong>.
                  {stats.lowStockGroups?.length > 0
                    ? ` ${stats.lowStockGroups.length} blood group(s) need attention.`
                    : ' All blood groups are within safe stock levels.'}
                </p>
                <div className="welcome-actions">
                  <Link to="/inventory" className="btn-primary">
                    View Inventory <RiArrowRightSLine />
                  </Link>
                  {stats.pendingRequests > 0 && (
                    <Link to="/requests" className="btn-secondary">
                      {stats.pendingRequests} Pending Request{stats.pendingRequests !== 1 ? 's' : ''}
                    </Link>
                  )}
                </div>
              </div>
              <div className="progress-circle-container">
                <svg width="90" height="90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="3.5"
                  />
                  <path
                    strokeDasharray={`${healthPercent}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--primary-color)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <text x="18" y="20.35" fill="var(--text-main)" fontSize="7" fontWeight="bold" textAnchor="middle">
                    {healthPercent}%
                  </text>
                </svg>
                <span className="progress-label">Stock Health</span>
              </div>
            </div>

            <div className="stats-cards-grid">
              <StatCard
                title="Total Donors"
                value={stats.totalDonors}
                subtitle={`${stats.totalDonations || 0} donations recorded`}
                icon={RiUserHeartLine}
                iconBg="#e6fffa"
                iconColor="#01b8b8"
                onClick={() => navigate('/donors')}
              />
              <StatCard
                title="Available Units"
                value={`${Number(stats.totalAvailableUnits).toFixed(1)}`}
                subtitle="Liters in storage"
                icon={RiDropLine}
                iconBg="#ebf8ff"
                iconColor="#3182ce"
                onClick={() => navigate('/inventory')}
              />
              <StatCard
                title="Pending Requests"
                value={stats.pendingRequests}
                subtitle={`${stats.totalRequests} total requests`}
                icon={RiFileList3Line}
                iconBg="#fff5f5"
                iconColor="#e53e3e"
                onClick={() => navigate('/requests')}
              />
              <StatCard
                title="Partner Hospitals"
                value={stats.totalHospitals}
                subtitle="Active partnerships"
                icon={RiHospitalLine}
                iconBg="#fffaf0"
                iconColor="#dd6b20"
                onClick={() => navigate('/hospitals')}
              />
            </div>
          </div>

          {/* Blood Group Chart */}
          <div className="card chart-card">
            <div className="flex-between chart-card-header">
              <div>
                <h2 className="card-section-title">Blood Group Stock</h2>
                <p className="card-section-subtitle">Available units by type</p>
              </div>
              {hoveredGroup && (
                <span className="chart-tooltip">
                  {hoveredGroup}: {Number(groupDistribution[hoveredGroup] || 0).toFixed(1)} units
                </span>
              )}
            </div>
            <div className="blood-group-chart">
              {BLOOD_GROUPS.map((group) => {
                const val = Number(groupDistribution[group] || 0);
                const pct = (val / maxStockVal) * 100;
                const isLow = val < 5;
                return (
                  <div
                    key={group}
                    className="chart-bar-column"
                    onMouseEnter={() => setHoveredGroup(group)}
                    onMouseLeave={() => setHoveredGroup(null)}
                    onClick={() => navigate('/inventory')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/inventory')}
                  >
                    <div className="chart-bar-track">
                      <div
                        className={`chart-bar-fill ${isLow ? 'chart-bar-low' : ''}`}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                        title={`${val} units`}
                      />
                    </div>
                    <span className={`chart-bar-label ${isLow ? 'text-danger' : ''}`}>{group}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="card-section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.to} to={action.to} className="quick-action-btn">
                  <span className="quick-action-icon" style={{ backgroundColor: `${action.color}15`, color: action.color }}>
                    <Icon size={20} />
                  </span>
                  <span>{action.label}</span>
                  <RiAddLine size={16} className="quick-action-plus" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Three column row */}
        <div className="dashboard-three-columns">
          {/* Stock Alerts */}
          <div className="card">
            <h2 className="card-section-title">Inventory Alerts</h2>
            <div className="alert-list">
              <div className="alert-list-item">
                <RiDropLine size={20} className="alert-icon success" />
                <div className="alert-list-content">
                  <strong>Total Available Stock</strong>
                  <span>{Number(stats.totalAvailableUnits).toFixed(1)} units active</span>
                </div>
                <span className="badge success">{stats.issuedUnitsCount || 0} issued</span>
              </div>
              <div className="alert-list-item">
                <RiAlertLine size={20} className="alert-icon warning" />
                <div className="alert-list-content">
                  <strong>Expiring Soon</strong>
                  <span>Within 7 days</span>
                </div>
                <Link to="/inventory" className="badge warning">{stats.expiringUnitsCount} bags</Link>
              </div>
              <div className="alert-list-item">
                <RiAlertLine size={20} className="alert-icon danger" />
                <div className="alert-list-content">
                  <strong>Expired / Disposed</strong>
                  <span>Requires removal</span>
                </div>
                <span className="badge danger">{stats.expiredUnitsCount} bags</span>
              </div>
              {stats.lowStockGroups?.length > 0 && (
                <div className="alert-list-item">
                  <RiAlertLine size={20} className="alert-icon danger" />
                  <div className="alert-list-content">
                    <strong>Low Stock Groups</strong>
                    <span>{stats.lowStockGroups.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h2 className="card-section-title">Today&apos;s Appointments</h2>
              <Link to="/appointments" className="link-sm">View all</Link>
            </div>
            <div className="task-list">
              {(stats.todayAppointments || []).length === 0 ? (
                <p className="empty-inline">No appointments scheduled for today.</p>
              ) : (
                stats.todayAppointments.map((app) => (
                  <div key={app.id} className="task-list-item">
                    <RiCheckboxCircleLine
                      size={18}
                      className={app.status === 'Completed' ? 'text-success' : 'text-muted'}
                    />
                    <div className="task-list-content">
                      <strong>{app.donor?.fullName || 'Donor'}</strong>
                      <span>{app.appointmentTime?.substring(0, 5) || '—'} · {app.status}</span>
                    </div>
                    <span className="badge info">{app.donor?.bloodGroup?.groupName || '?'}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Requests */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h2 className="card-section-title">Pending Requests</h2>
              <Link to="/requests" className="link-sm">Manage</Link>
            </div>
            <div className="task-list">
              {(stats.pendingRequestList || []).length === 0 ? (
                <p className="empty-inline">No pending blood requests.</p>
              ) : (
                stats.pendingRequestList.map((req) => (
                  <div key={req.id} className="task-list-item">
                    <RiFileList3Line size={18} className="text-warning" />
                    <div className="task-list-content">
                      <strong>{req.hospital?.hospitalName || 'Hospital'}</strong>
                      <span>
                        {req.items?.map((i) => `${i.bloodGroup?.groupName}: ${i.requestedUnits}u`).join(', ')}
                      </span>
                    </div>
                    <span className={`badge ${req.priority === 'Urgent' ? 'danger' : 'warning'}`}>
                      {req.priority || 'Medium'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Donations Table */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <div>
              <h2 className="card-section-title">Recent Donations</h2>
              <p className="card-section-subtitle">Latest blood collection records</p>
            </div>
            <Link to="/donations" className="btn-secondary btn-sm">View All</Link>
          </div>
          <div className="nowa-table-container">
            <table className="nowa-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Date</th>
                  <th>Volume</th>
                  <th>Doctor</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentDonations || []).length === 0 ? (
                  <tr><td colSpan="5" className="text-center">No donations recorded yet.</td></tr>
                ) : (
                  stats.recentDonations.map((don) => (
                    <tr key={don.id}>
                      <td>{don.donor?.fullName || 'N/A'}</td>
                      <td><span className="badge info">{don.donor?.bloodGroup?.groupName || '?'}</span></td>
                      <td>{don.donationDate}</td>
                      <td><strong>{Number(don.units).toFixed(2)} L</strong></td>
                      <td>{don.doctorName || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
