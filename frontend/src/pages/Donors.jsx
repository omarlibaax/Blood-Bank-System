import React, { useEffect, useState } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiSearchLine } from 'react-icons/ri';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { paginate, totalPages } from '../utils/pagination';

const PAGE_SIZE = 8;

const Donors = () => {
  const [donors, setDonors] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDonor, setCurrentDonor] = useState(null);

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [bloodGroupId, setBloodGroupId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState('');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = search
        ? await api.get(`/donors/search?name=${search}`)
        : await api.get('/donors');
      setDonors(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodGroups = async () => {
    try {
      const res = await api.get('/blood-groups');
      setBloodGroups(res.data);
      if (res.data.length > 0) setBloodGroupId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDonors();
    fetchBloodGroups();
  }, [search]);

  const filteredDonors = donors.filter((d) =>
    statusFilter === 'all' ? true : d.status === statusFilter
  );
  const pages = totalPages(filteredDonors.length, PAGE_SIZE);
  const pagedDonors = paginate(filteredDonors, currentPage, PAGE_SIZE);

  const resetForm = () => {
    setFullName('');
    setGender('Male');
    setAge('');
    if (bloodGroups.length > 0) setBloodGroupId(bloodGroups[0].id);
    setPhone('');
    setEmail('');
    setAddress('');
    setPhoto('');
    setStatus('Active');
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    if (!fullName || !age || !phone || !bloodGroupId) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      const selectedBg = bloodGroups.find((bg) => bg.id === parseInt(bloodGroupId));
      await api.post('/donors', {
        fullName, gender, age: parseInt(age), bloodGroup: selectedBg,
        phone, email, address, photo: photo || null, status,
      });
      setShowAddModal(false);
      fetchDonors();
    } catch {
      setError('Failed to add donor. Try again.');
    }
  };

  const handleOpenEdit = (donor) => {
    setCurrentDonor(donor);
    setFullName(donor.fullName);
    setGender(donor.gender || 'Male');
    setAge(donor.age || '');
    setBloodGroupId(donor.bloodGroup ? donor.bloodGroup.id : '');
    setPhone(donor.phone || '');
    setEmail(donor.email || '');
    setAddress(donor.address || '');
    setPhoto(donor.photo || '');
    setStatus(donor.status || 'Active');
    setError('');
    setShowEditModal(true);
  };

  const handleEditDonor = async (e) => {
    e.preventDefault();
    try {
      const selectedBg = bloodGroups.find((bg) => bg.id === parseInt(bloodGroupId));
      await api.put(`/donors/${currentDonor.id}`, {
        fullName, gender, age: parseInt(age), bloodGroup: selectedBg,
        phone, email, address, photo: photo || null, status,
      });
      setShowEditModal(false);
      fetchDonors();
    } catch {
      setError('Failed to update donor.');
    }
  };

  const handleDeleteDonor = async (id) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      try {
        await api.delete(`/donors/${id}`);
        fetchDonors();
      } catch {
        alert('Failed to delete donor. They may have linked donation records.');
      }
    }
  };

  const renderDonorForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Full Name *</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Age *</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Blood Group *</label>
          <select value={bloodGroupId} onChange={(e) => setBloodGroupId(e.target.value)} required>
            {bloodGroups.map((bg) => (
              <option key={bg.id} value={bg.id}>{bg.groupName}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Phone *</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Donor Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Active">Active</option>
            <option value="Deferred">Deferred</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="form-group">
          <label>Photo URL (Optional)</label>
          <input type="text" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://..." />
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
        title="Donor Management"
        subtitle="Search and maintain donor records"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Donors' }]}
        actions={
          <button type="button" onClick={handleOpenAdd} className="btn-primary">
            <RiAddLine size={16} /> Add New Donor
          </button>
        }
      />

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <RiSearchLine className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search donors by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Deferred">Deferred</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading donor catalog..." />
        ) : (
          <>
            <div className="nowa-table-container">
              <table className="nowa-table">
                <thead>
                  <tr>
                    <th>Donor Code</th>
                    <th>Name</th>
                    <th>Blood Group</th>
                    <th>Gender/Age</th>
                    <th>Phone</th>
                    <th>Last Donation</th>
                    <th>Donations</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedDonors.length === 0 ? (
                    <tr><td colSpan="9" className="text-center">No donors found.</td></tr>
                  ) : (
                    pagedDonors.map((donor) => (
                      <tr key={donor.id}>
                        <td><strong>{donor.donorCode || 'N/A'}</strong></td>
                        <td>
                          <div className="avatar-group-item">
                            <img
                              src={donor.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'}
                              className="avatar-small"
                              alt=""
                            />
                            <span>{donor.fullName}</span>
                          </div>
                        </td>
                        <td><span className="badge info">{donor.bloodGroup?.groupName || 'Unknown'}</span></td>
                        <td>{donor.gender || 'N/A'} ({donor.age || 'N/A'})</td>
                        <td>{donor.phone}</td>
                        <td>{donor.lastDonationDate || 'Never'}</td>
                        <td>{donor.totalDonations || 0}</td>
                        <td>
                          <span className={`badge ${donor.status === 'Active' ? 'success' : 'danger'}`}>
                            {donor.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-btn-group">
                            <button type="button" onClick={() => handleOpenEdit(donor)} className="icon-btn" title="Edit">
                              <RiEditLine size={16} />
                            </button>
                            <button type="button" onClick={() => handleDeleteDonor(donor.id)} className="icon-btn danger" title="Delete">
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
            <Pagination
              currentPage={currentPage}
              totalPages={pages}
              onPageChange={setCurrentPage}
              totalItems={filteredDonors.length}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Add New Donor</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderDonorForm(handleAddDonor, 'Save Donor')}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Edit Donor Details</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderDonorForm(handleEditDonor, 'Save Changes')}
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors;
