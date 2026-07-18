import React, { useEffect, useState } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiSearchLine } from 'react-icons/ri';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentHospital, setCurrentHospital] = useState(null);

  const [hospitalName, setHospitalName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [status, setStatus] = useState(true);
  const [error, setError] = useState('');

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hospitals');
      setHospitals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const resetForm = () => {
    setHospitalName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setContactPerson('');
    setStatus(true);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (hosp) => {
    setCurrentHospital(hosp);
    setHospitalName(hosp.hospitalName);
    setPhone(hosp.phone);
    setEmail(hosp.email || '');
    setAddress(hosp.address || '');
    setContactPerson(hosp.contactPerson || '');
    setStatus(hosp.status);
    setError('');
    setShowEditModal(true);
  };

  const handleSave = async (e, isEdit) => {
    e.preventDefault();
    if (!hospitalName || !phone) {
      setError('Please fill in required fields.');
      return;
    }
    try {
      const payload = { hospitalName, phone, email, address, contactPerson, status };
      if (isEdit) {
        await api.put(`/hospitals/${currentHospital.id}`, payload);
        setShowEditModal(false);
      } else {
        await api.post('/hospitals', payload);
        setShowAddModal(false);
      }
      fetchHospitals();
    } catch {
      setError('Failed to save hospital record.');
    }
  };

  const toggleHospitalStatus = async (hospital) => {
    try {
      await api.put(`/hospitals/${hospital.id}`, { ...hospital, status: !hospital.status });
      fetchHospitals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hospital permanently?')) return;
    try {
      await api.delete(`/hospitals/${id}`);
      fetchHospitals();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to delete hospital. It may have linked blood requests.');
    }
  };

  const filtered = hospitals.filter((h) =>
    !search || h.hospitalName?.toLowerCase().includes(search.toLowerCase()) ||
    h.hospitalCode?.toLowerCase().includes(search.toLowerCase())
  );

  const renderHospitalForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Hospital Name *</label>
        <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Contact Person</label>
          <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Phone Number *</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value === 'true')}>
            <option value="true">Active Partner</option>
            <option value="false">Suspended</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Address</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="2" />
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
        <button type="submit" className="btn-primary">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div>
      <PageHeader
        title="Hospital Directory"
        subtitle="Registered partner hospitals and clinic centers"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Hospitals' }]}
        actions={
          <button type="button" onClick={handleOpenAdd} className="btn-primary">
            <RiAddLine size={16} /> Add Hospital
          </button>
        }
      />

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <RiSearchLine className="search-icon" size={16} />
            <input type="text" placeholder="Search hospitals..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading hospitals..." />
        ) : (
          <div className="nowa-table-container">
            <table className="nowa-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Hospital Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="text-center">No hospitals found.</td></tr>
                ) : (
                  filtered.map((hosp) => (
                    <tr key={hosp.id}>
                      <td><strong>{hosp.hospitalCode}</strong></td>
                      <td>{hosp.hospitalName}</td>
                      <td>{hosp.contactPerson || 'N/A'}</td>
                      <td>{hosp.phone}</td>
                      <td>{hosp.email || 'N/A'}</td>
                      <td>
                        <span className={`badge ${hosp.status ? 'success' : 'danger'}`}>
                          {hosp.status ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btn-group">
                          <button type="button" onClick={() => handleOpenEdit(hosp)} className="icon-btn" title="Edit">
                            <RiEditLine size={16} />
                          </button>
                          <button type="button" onClick={() => toggleHospitalStatus(hosp)} className="btn-secondary btn-sm">
                            {hosp.status ? 'Suspend' : 'Activate'}
                          </button>
                          <button type="button" onClick={() => handleDelete(hosp.id)} className="icon-btn danger" title="Delete">
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
              <h2>Add Hospital</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderHospitalForm((e) => handleSave(e, false), 'Save Partner')}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Edit Hospital</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderHospitalForm((e) => handleSave(e, true), 'Save Changes')}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
