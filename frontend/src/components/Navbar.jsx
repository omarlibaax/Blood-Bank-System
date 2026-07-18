import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RiMenuLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiSearchLine,
  RiNotification3Line,
  RiLogoutBoxRLine,
  RiDropLine,
  RiFileList3Line,
  RiUserSettingsLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useLayout();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  const [notifications, setNotifications] = useState({ pending: 0, expiring: 0, lowStock: 0 });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setNotifications({
          pending: res.data.pendingRequests || 0,
          expiring: res.data.expiringUnitsCount || 0,
          lowStock: (res.data.lowStockGroups || []).length,
        });
      } catch {
        /* ignore */
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate('/login');
  };

  const totalAlerts = notifications.pending + notifications.expiring + notifications.lowStock;
  const ToggleIcon = isMobile ? RiMenuLine : sidebarCollapsed ? RiMenuUnfoldLine : RiMenuFoldLine;

  return (
    <header className="nowa-navbar">
      <div className="navbar-left">
        <button type="button" className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <ToggleIcon size={20} />
        </button>
        <div className="search-bar">
          <RiSearchLine size={16} />
          <input type="text" placeholder="Search donors, hospitals, requests..." />
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-icon-dropdown" ref={notificationsRef}>
          <button
            type="button"
            className="navbar-icon badge-container"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
          >
            <RiNotification3Line size={20} />
            {totalAlerts > 0 && <span className="badge-count">{totalAlerts > 9 ? '9+' : totalAlerts}</span>}
          </button>

          {showNotifications && (
            <div className="dropdown-panel">
              <div className="dropdown-header">System Alerts</div>
              {notifications.pending > 0 && (
                <Link to="/requests" className="dropdown-item" onClick={() => setShowNotifications(false)}>
                  <RiFileList3Line size={18} className="dropdown-item-icon warning" />
                  <div>
                    <strong>{notifications.pending} pending request{notifications.pending !== 1 ? 's' : ''}</strong>
                    <span>Requires review and approval</span>
                  </div>
                </Link>
              )}
              {notifications.expiring > 0 && (
                <Link to="/inventory" className="dropdown-item" onClick={() => setShowNotifications(false)}>
                  <RiDropLine size={18} className="dropdown-item-icon danger" />
                  <div>
                    <strong>{notifications.expiring} bag{notifications.expiring !== 1 ? 's' : ''} expiring soon</strong>
                    <span>Within the next 7 days</span>
                  </div>
                </Link>
              )}
              {notifications.lowStock > 0 && (
                <Link to="/inventory" className="dropdown-item" onClick={() => setShowNotifications(false)}>
                  <RiDropLine size={18} className="dropdown-item-icon warning" />
                  <div>
                    <strong>{notifications.lowStock} blood group{notifications.lowStock !== 1 ? 's' : ''} low on stock</strong>
                    <span>Below safe threshold</span>
                  </div>
                </Link>
              )}
              {totalAlerts === 0 && (
                <div className="dropdown-empty">No active alerts. All systems normal.</div>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="navbar-user-dropdown" ref={profileRef}>
            <button
              type="button"
              className={`navbar-user-profile profile-dropdown-toggle ${showProfileMenu ? 'open' : ''}`}
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
                alt=""
                className="user-avatar"
              />
              <div className="user-info">
                <span className="user-name">{user.fullName || user.username}</span>
                <span className="user-role">{user.roles ? user.roles[0] : 'Staff'}</span>
              </div>
              <RiArrowDownSLine size={16} className={`profile-chevron ${showProfileMenu ? 'rotated' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="dropdown-panel profile-dropdown-panel">
                <div className="profile-dropdown-header">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
                    alt=""
                    className="user-avatar"
                  />
                  <div>
                    <strong>{user.fullName || user.username}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <Link to="/profile" className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                  <RiUserSettingsLine size={18} />
                  My Profile
                </Link>
                <button type="button" className="profile-menu-item danger" onClick={handleLogout}>
                  <RiLogoutBoxRLine size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
