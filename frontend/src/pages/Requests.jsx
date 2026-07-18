import React, { useEffect, useState } from 'react';
import { RiAddLine, RiCheckLine, RiCloseLine, RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [hospitalId, setHospitalId] = useState('');
  const [bloodGroupId, setBloodGroupId] = useState('');
  const [requestedUnits, setRequestedUnits] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [requestedBy, setRequestedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitalsAndGroups = async () => {
    try {
      const hospRes = await api.get('/hospitals');
      const active = hospRes.data.filter((h) => h.status !== false);
      setHospitals(active);
      if (active.length > 0) setHospitalId(active[0].id);

      const bgRes = await api.get('/blood-groups');
      setBloodGroups(bgRes.data);
      if (bgRes.data.length > 0) setBloodGroupId(bgRes.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchHospitalsAndGroups();
  }, []);

  const isPending = (status) => !status || status === 'Pending';

  const resetForm = () => {
    setRequestedUnits('');
    setRequestedBy('');
    setRemarks('');
    setPriority('Medium');
    setEditingId(null);
    setError('');
    if (hospitals.length > 0) setHospitalId(hospitals[0].id);
    if (bloodGroups.length > 0) setBloodGroupId(bloodGroups[0].id);
  };

  const buildPayload = () => ({
    hospital: { id: hospitalId },
    priority,
    requestedBy,
    remarks,
    status: 'Pending',
    requestDate: new Date().toISOString().split('T')[0],
    items: [{ bloodGroup: { id: parseInt(bloodGroupId, 10) }, requestedUnits: parseFloat(requestedUnits) }],
  });

  const filtered = requests.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'Pending') return isPending(r.status);
    return r.status === statusFilter;
  });

  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (!hospitalId || !bloodGroupId || !requestedUnits || !requestedBy) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setError('');
      await api.post('/requests', buildPayload());
      setShowAddModal(false);
      resetForm();
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to create blood request.');
    }
  };

  const handleOpenEdit = (req) => {
    const item = req.items?.[0];
    setEditingId(req.id);
    setHospitalId(req.hospital?.id || '');
    setBloodGroupId(item?.bloodGroup?.id || '');
    setRequestedUnits(item?.requestedUnits != null ? String(item.requestedUnits) : '');
    setPriority(req.priority || 'Medium');
    setRequestedBy(req.requestedBy || '');
    setRemarks(req.remarks || '');
    setError('');
    setShowEditModal(true);
  };

  const handleEditRequest = async (e) => {
    e.preventDefault();
    if (!hospitalId || !bloodGroupId || !requestedUnits || !requestedBy) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setError('');
      await api.put(`/requests/${editingId}`, buildPayload());
      setShowEditModal(false);
      resetForm();
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to update blood request.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blood request? If it was approved, issued stock will be returned to Available.')) return;
    try {
      await api.delete(`/requests/${id}`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to delete request.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/requests/${id}/approve`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to approve. Ensure sufficient inventory exists.');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this blood request?')) {
      try {
        await api.post(`/requests/${id}/reject`);
        fetchRequests();
      } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to reject request.');
      }
    }
  };

  const getPriorityBadge = (prio) => {
    const map = { Urgent: 'danger', High: 'warning', Medium: 'info' };
    return <span className={`badge ${map[prio] || 'success'}`}>{prio}</span>;
  };

  const getStatusBadge = (s) => {
    const status = s || 'Pending';
    const map = { Approved: 'success', Rejected: 'danger', Pending: 'warning' };
    return <span className={`badge ${map[status] || 'warning'}`}>{status}</span>;
  };

  const renderRequestForm = (onSubmit, submitLabel, onCancel) => (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Hospital *</label>
        <select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} required>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.hospitalName}</option>
          ))}
        </select>
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label>Blood Group *</label>
          <select value={bloodGroupId} onChange={(e) => setBloodGroupId(e.target.value)} required>
            {bloodGroups.map((bg) => (
              <option key={bg.id} value={bg.id}>{bg.groupName}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Units Needed *</label>
          <input type="number" step="0.1" value={requestedUnits} onChange={(e) => setRequestedUnits(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Contact Representative *</label>
        <input type="text" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="Dr. Smith" required />
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
        title="Blood Requests"
        subtitle="Create, edit, approve or reject hospital blood requests"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Requests' }]}
        actions={
          <button
            type="button"
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="btn-primary"
            disabled={hospitals.length === 0}
          >
            <RiAddLine size={16} /> Create Request
          </button>
        }
      />

      {hospitals.length === 0 && (
        <div className="alert alert-danger">Register at least one active hospital before creating blood requests.</div>
      )}

      <div className="card">
        <div className="filters-bar">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading requests..." />
        ) : (
          <div className="nowa-table-container">
            <table className="nowa-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Hospital</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Details</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Approved By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="text-center">No requests found.</td></tr>
                ) : (
                  filtered.map((req) => (
                    <tr key={req.id}>
                      <td><strong>{req.id.substring(0, 8)}...</strong></td>
                      <td>{req.hospital?.hospitalName || 'Unknown'}</td>
                      <td>{req.requestDate || '—'}</td>
                      <td>{getPriorityBadge(req.priority)}</td>
                      <td>
                        {req.items?.map((item, idx) => (
                          <div key={idx} style={{ fontSize: '13px' }}>
                            <strong>{item.bloodGroup?.groupName || 'N/A'}</strong>: {item.requestedUnits?.toFixed(2)} units
                            {item.issuedUnits > 0 && (
                              <span style={{ color: 'var(--success-color)', marginLeft: '6px' }}>
                                ({item.issuedUnits.toFixed(2)} issued)
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td>{req.requestedBy}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>{req.approvedBy?.fullName || '—'}</td>
                      <td>
                        <div className="action-btn-group">
                          {isPending(req.status) && (
                            <>
                              <button type="button" onClick={() => handleApprove(req.id)} className="icon-btn success" title="Approve">
                                <RiCheckLine size={16} />
                              </button>
                              <button type="button" onClick={() => handleReject(req.id)} className="icon-btn danger" title="Reject">
                                <RiCloseLine size={16} />
                              </button>
                              <button type="button" onClick={() => handleOpenEdit(req)} className="icon-btn" title="Edit">
                                <RiEditLine size={16} />
                              </button>
                            </>
                          )}
                          <button type="button" onClick={() => handleDelete(req.id)} className="icon-btn danger" title="Delete">
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
              <h2>Create Blood Request</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderRequestForm(handleAddRequest, 'Submit Request', () => setShowAddModal(false))}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Edit Blood Request</h2>
              <button type="button" className="modal-close-btn" onClick={() => { setShowEditModal(false); resetForm(); }}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderRequestForm(handleEditRequest, 'Save Changes', () => { setShowEditModal(false); resetForm(); })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
