import React, { useEffect, useState } from 'react';
import { RiRefreshLine, RiSearchLine, RiDeleteBinLine } from 'react-icons/ri';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { paginate, totalPages } from '../utils/pagination';

const PAGE_SIZE = 10;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleCheckExpired = async () => {
    try {
      setStatusMessage('Scanning freezer inventory...');
      await api.post('/inventory/check-expired');
      setStatusMessage('Expired items updated successfully.');
      fetchInventory();
      setTimeout(() => setStatusMessage(''), 3000);
    } catch {
      setStatusMessage('Failed to scan expiration dates.');
    }
  };

  const handleDeleteExpired = async (id) => {
    if (window.confirm('Remove this expired blood bag from inventory?')) {
      try {
        await api.delete(`/inventory/${id}`);
        fetchInventory();
      } catch {
        alert('Failed to remove bag.');
      }
    }
  };

  const getStatusBadge = (s) => {
    const map = { Available: 'success', Expired: 'danger', Issued: 'info' };
    return <span className={`badge ${map[s] || 'warning'}`}>{s}</span>;
  };

  const groupStock = {};
  BLOOD_GROUPS.forEach((g) => { groupStock[g] = 0; });
  inventory.forEach((item) => {
    if (item.status === 'Available' && item.bloodGroup) {
      groupStock[item.bloodGroup.groupName] = (groupStock[item.bloodGroup.groupName] || 0) + (item.units || 0);
    }
  });

  const filtered = inventory.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchGroup = groupFilter === 'all' || item.bloodGroup?.groupName === groupFilter;
    const matchSearch = !search || item.bloodBagNumber?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchGroup && matchSearch;
  });

  const pages = totalPages(filtered.length, PAGE_SIZE);
  const paged = paginate(filtered, currentPage, PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Blood Inventory"
        subtitle="Stock is updated automatically from donations and request approvals"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Inventory' }]}
        actions={
          <button type="button" onClick={handleCheckExpired} className="btn-secondary">
            <RiRefreshLine size={16} /> Check Expirations
          </button>
        }
      />

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '14px' }}>
          <div>
            <h2 className="card-section-title">Blood Stock Levels</h2>
            <p className="card-section-subtitle">Available units only (Issued bags are excluded)</p>
          </div>
          {statusMessage && <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 'bold' }}>{statusMessage}</span>}
        </div>

        {BLOOD_GROUPS.some((g) => groupStock[g] < 5) && (
          <div className="alert alert-danger">
            <strong>Critical Low Stock:</strong> One or more blood groups are below the safe threshold (5.0 units).
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {BLOOD_GROUPS.map((group) => {
            const val = groupStock[group];
            const level = val === 0 ? 'danger' : val < 5 ? 'warning' : 'success';
            return (
              <div key={group} className={`stock-tile stock-tile-${level}`}>
                <div className="stock-tile-group">{group}</div>
                <div className="stock-tile-value">{val.toFixed(1)}</div>
                <div className="stock-tile-label">Units</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="card-section-title" style={{ marginBottom: '14px' }}>Blood Freezer Directory</h2>

        <div className="filters-bar">
          <div className="search-input-wrap">
            <RiSearchLine className="search-icon" size={16} />
            <input type="text" placeholder="Search by bag number..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
            <option value="Expired">Expired</option>
          </select>
          <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Blood Groups</option>
            {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading freezer catalog..." />
        ) : (
          <>
            <div className="nowa-table-container">
              <table className="nowa-table">
                <thead>
                  <tr>
                    <th>Bag Number</th>
                    <th>Blood Group</th>
                    <th>Quantity</th>
                    <th>Collection</th>
                    <th>Expiry</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan="8" className="text-center">No inventory items found.</td></tr>
                  ) : (
                    paged.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.bloodBagNumber}</strong></td>
                        <td><span className="badge info">{item.bloodGroup?.groupName || 'N/A'}</span></td>
                        <td>{item.units?.toFixed(2) || '0.00'} L</td>
                        <td>{item.collectionDate}</td>
                        <td style={{ color: item.status === 'Expired' ? 'var(--danger-color)' : 'inherit', fontWeight: item.status === 'Expired' ? 600 : 400 }}>
                          {item.expiryDate}
                        </td>
                        <td>{item.location || 'Shelf A'}</td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>
                          {item.status === 'Expired' ? (
                            <button type="button" onClick={() => handleDeleteExpired(item.id)} className="icon-btn danger" title="Remove expired bag">
                              <RiDeleteBinLine size={16} />
                            </button>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '12px' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={pages} onPageChange={setCurrentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </div>
    </div>
  );
};

export default Inventory;
