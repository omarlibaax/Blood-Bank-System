import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  RiDashboardLine,
  RiUserHeartLine,
  RiDropLine,
  RiHospitalLine,
  RiFileList3Line,
  RiCalendarEventLine,
  RiHeartPulseLine,
  RiUserSettingsLine,
  RiBarChartBoxLine,
  RiAdminLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';

const reportLinks = [
  { to: '/reports/donations', label: 'Donation Report' },
  { to: '/reports/inventory', label: 'Inventory Report' },
  { to: '/reports/requests', label: 'Request Report' },
  { to: '/reports/hospitals', label: 'Hospital Report' },
];

const Sidebar = () => {
  const { user } = useAuth();
  const { sidebarCollapsed, closeMobileSidebar } = useLayout();
  const location = useLocation();
  const isAdmin = user?.roles?.includes('Administrator');

  const reportsActive = location.pathname.startsWith('/reports');
  const [reportsOpen, setReportsOpen] = useState(reportsActive);

  useEffect(() => {
    if (reportsActive) setReportsOpen(true);
  }, [reportsActive]);

  const mainLinks = [
    { to: '/dashboard', icon: RiDashboardLine, label: 'Dashboard', section: 'MAIN' },
    { to: '/donors', icon: RiUserHeartLine, label: 'Donors', section: 'OPERATIONS' },
    { to: '/inventory', icon: RiDropLine, label: 'Blood Inventory', section: 'OPERATIONS' },
    { to: '/donations', icon: RiHeartPulseLine, label: 'Donation History', section: 'OPERATIONS' },
    { to: '/hospitals', icon: RiHospitalLine, label: 'Hospitals', section: 'MANAGEMENT' },
    { to: '/requests', icon: RiFileList3Line, label: 'Blood Requests', section: 'MANAGEMENT' },
    { to: '/appointments', icon: RiCalendarEventLine, label: 'Appointments', section: 'MANAGEMENT' },
  ];

  const bottomLinks = [
    ...(isAdmin ? [{ to: '/users', icon: RiAdminLine, label: 'User Management', section: 'ADMINISTRATION' }] : []),
    { to: '/profile', icon: RiUserSettingsLine, label: 'User Profile', section: 'ACCOUNT' },
  ];

  const allItems = [...mainLinks, { type: 'reports' }, ...bottomLinks];
  let lastSection = '';

  const handleNavClick = () => {
    if (window.innerWidth <= 768) closeMobileSidebar();
  };

  const renderLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={handleNavClick}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <span className="nav-item-icon"><Icon size={18} /></span>
        <span className="nav-item-text">{item.label}</span>
      </NavLink>
    );
  };

  const renderReportsGroup = () => {
    const showSection = lastSection !== 'ANALYTICS';
    lastSection = 'ANALYTICS';

    if (sidebarCollapsed) {
      return (
        <React.Fragment key="reports">
          {showSection && <div className="nav-section-title">ANALYTICS</div>}
          <div className="nav-item-group collapsed-flyout">
            <NavLink
              to="/reports/donations"
              onClick={handleNavClick}
              className={`nav-item ${reportsActive ? 'active' : ''}`}
              title="Reports"
            >
              <span className="nav-item-icon"><RiBarChartBoxLine size={18} /></span>
            </NavLink>
            <div className="nav-flyout-menu">
              <div className="nav-flyout-title">Reports</div>
              {reportLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={handleNavClick}
                  className={({ isActive }) => `nav-flyout-item ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key="reports">
        {showSection && <div className="nav-section-title">ANALYTICS</div>}
        <div className="nav-item-group">
          <button
            type="button"
            className={`nav-item-dropdown-toggle ${reportsOpen ? 'active-dropdown' : ''} ${reportsActive ? 'has-active-child' : ''}`}
            onClick={() => setReportsOpen(!reportsOpen)}
          >
            <span className="nav-item-icon"><RiBarChartBoxLine size={18} /></span>
            <span className="nav-item-text">Reports</span>
            <span className="nav-arrow">{reportsOpen ? <RiArrowDownSLine size={14} /> : <RiArrowRightSLine size={14} />}</span>
          </button>
          {reportsOpen && (
            <div className="nav-sub-items">
              {reportLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={handleNavClick}
                  className={({ isActive }) => `nav-sub-item ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </React.Fragment>
    );
  };

  return (
    <aside className="nowa-sidebar">
      <div className="sidebar-brand">
        <svg className="brand-logo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="brand-text">BloodBank</span>
      </div>

      <nav className="sidebar-nav sidebar-scroll">
        {allItems.map((item) => {
          if (item.type === 'reports') {
            return renderReportsGroup();
          }
          const showSection = item.section !== lastSection;
          lastSection = item.section;
          return (
            <React.Fragment key={item.to}>
              {showSection && <div className="nav-section-title">{item.section}</div>}
              {renderLink(item)}
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
