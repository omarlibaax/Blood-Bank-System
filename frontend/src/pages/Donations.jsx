import React, { useEffect, useState } from 'react';
import { RiAddLine, RiSearchLine, RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const Donations = () => {
  const [donations, setDonations] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [donorId, setDonorId] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [units, setUnits] = useState('0.45');
  const [doctorName, setDoctorName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donations');
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      const res = await api.get('/donors');
      const active = res.data.filter((d) => d.status === 'Active' || !d.status);
      setDonors(active.length ? active : res.data);
      if ((active.length ? active : res.data).length > 0) {
        setDonorId((active.length ? active : res.data)[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchDonors();
  }, []);

  const resetForm = () => {
    setDonationDate(new Date().toISOString().split('T')[0]);
    setUnits('0.45');
    setDoctorName('');
    setRemarks('');
    setEditingId(null);
    setError('');
    if (donors.length > 0) setDonorId(donors[0].id);
  };

  const filtered = donations.filter((don) =>
    !search || don.donor?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    don.doctorName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDonation = async (e) => {
    e.preventDefault();
    if (!donorId || !donationDate || !units || !doctorName) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setError('');
      await api.post('/donations', {
        donor: { id: donorId },
        donationDate,
        units: parseFloat(units),
        doctorName,
        remarks,
      });
      setShowAddModal(false);
      resetForm();
      fetchDonations();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error || 'Failed to record donation.');
    }
  };

  const handleOpenEdit = (don) => {
    setEditingId(don.id);
    setDonorId(don.donor?.id || '');
    setDonationDate(don.donationDate || '');
    setUnits(don.units != null ? String(don.units) : '');
    setDoctorName(don.doctorName || '');
    setRemarks(don.remarks || '');
    setError('');
    setShowEditModal(true);
  };

  const handleEditDonation = async (e) => {
    e.preventDefault();
    if (!donationDate || !units || !doctorName) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setError('');
      await api.put(`/donations/${editingId}`, {
        donationDate,
        units: parseFloat(units),
        doctorName,
        remarks,
      });
      setShowEditModal(false);
      resetForm();
      fetchDonations();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to update donation.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this donation and its available inventory bag?')) return;
    try {
      await api.delete(`/donations/${id}`);
      fetchDonations();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to delete donation.');
    }
  };

  const renderDonationForm = (onSubmit, submitLabel, onCancel, includeDonor) => (
    <form onSubmit={onSubmit}>
      {includeDonor && (
        <div className="form-group">
          <label>Select Donor *</label>
          <select value={donorId} onChange={(e) => setDonorId(e.target.value)} required>
            {donors.map((d) => (
              <option key={d.id} value={d.id}>{d.fullName} ({d.bloodGroup?.groupName || '?'})</option>
            ))}
          </select>
        </div>
      )}
      <div className="form-row-3">
        <div className="form-group">
          <label>Donation Date *</label>
          <input type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Volume (Liters) *</label>
          <input type="number" step="0.01" value={units} onChange={(e) => setUnits(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Supervising Doctor *</label>
          <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Dr. Smith" required />
        </div>
      </div>
      <div className="form-group">
        <label>Remarks</label>
        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="2" />
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div>
      <PageHeader
        title="Donation History"
        subtitle="Blood collection records — new donations auto-update inventory"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Donations' }]}
        actions={
          <button type="button" onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary" disabled={donors.length === 0}>
            <RiAddLine size={16} /> Record Donation
          </button>
        }
      />

      {donors.length === 0 && (
        <div className="alert alert-danger">Register at least one active donor before recording donations.</div>
      )}

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <RiSearchLine className="search-icon" size={16} />
            <input type="text" placeholder="Search by donor or doctor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading donation history..." />
        ) : (
          <div className="nowa-table-container">
            <table className="nowa-table">
              <thead>
                <tr>
                  <th>Donation ID</th>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Date</th>
                  <th>Volume</th>
                  <th>Doctor</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="text-center">No donation records found.</td></tr>
                ) : (
                  filtered.map((don) => (
                    <tr key={don.id}>
                      <td><strong>{don.id.substring(0, 8)}...</strong></td>
                      <td>
                        <div className="avatar-group-item">
                          <img src={don.donor?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} className="avatar-small" alt="" />
                          <span>{don.donor?.fullName || 'N/A'}</span>
                        </div>
                      </td>
                      <td><span className="badge info">{don.donor?.bloodGroup?.groupName || 'N/A'}</span></td>
                      <td>{don.donationDate}</td>
                      <td><strong>{don.units?.toFixed(2) || '0.00'} L</strong></td>
                      <td>{don.doctorName}</td>
                      <td>{don.remarks || '—'}</td>
                      <td>
                        <div className="action-btn-group">
                          <button type="button" onClick={() => handleOpenEdit(don)} className="icon-btn" title="Edit">
                            <RiEditLine size={16} />
                          </button>
                          <button type="button" onClick={() => handleDelete(don.id)} className="icon-btn danger" title="Delete">
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
              <h2>Record Donation</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderDonationForm(handleAddDonation, 'Record Donation', () => setShowAddModal(false), true)}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Edit Donation</h2>
              <button type="button" className="modal-close-btn" onClick={() => { setShowEditModal(false); resetForm(); }}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderDonationForm(handleEditDonation, 'Save Changes', () => { setShowEditModal(false); resetForm(); }, false)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;
