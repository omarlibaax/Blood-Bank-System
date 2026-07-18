import React, { useEffect, useState } from 'react';
import { RiAddLine, RiCheckLine, RiCloseLine, RiDeleteBinLine, RiEditLine } from 'react-icons/ri';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [donorId, setDonorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data);
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
    fetchAppointments();
    fetchDonors();
  }, []);

  const isScheduled = (status) => !status || status === 'Scheduled';

  const resetForm = () => {
    setAppointmentDate('');
    setAppointmentTime('');
    setRemarks('');
    setEditingId(null);
    setError('');
    if (donors.length > 0) setDonorId(donors[0].id);
  };

  const filtered = appointments.filter((app) => {
    if (dateFilter === 'today') return app.appointmentDate === today;
    if (dateFilter === 'upcoming') return app.appointmentDate >= today && isScheduled(app.status);
    if (dateFilter === 'completed') return app.status === 'Completed';
    return true;
  }).sort((a, b) => {
    const d = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
    return d !== 0 ? d : (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
  });

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!donorId || !appointmentDate || !appointmentTime) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setError('');
      await api.post('/appointments', {
        donor: { id: donorId },
        appointmentDate,
        appointmentTime: appointmentTime.length === 5 ? `${appointmentTime}:00` : appointmentTime,
        remarks,
        status: 'Scheduled',
      });
      setShowAddModal(false);
      resetForm();
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to book appointment.');
    }
  };

  const handleOpenEdit = (app) => {
    setEditingId(app.id);
    setDonorId(app.donor?.id || '');
    setAppointmentDate(app.appointmentDate || '');
    setAppointmentTime(app.appointmentTime?.substring(0, 5) || '');
    setRemarks(app.remarks || '');
    setError('');
    setShowEditModal(true);
  };

  const handleEditAppointment = async (e) => {
    e.preventDefault();
    if (!donorId || !appointmentDate || !appointmentTime) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setError('');
      await api.put(`/appointments/${editingId}`, {
        donor: { id: donorId },
        appointmentDate,
        appointmentTime: appointmentTime.length === 5 ? `${appointmentTime}:00` : appointmentTime,
        remarks,
        status: 'Scheduled',
      });
      setShowEditModal(false);
      resetForm();
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to update appointment.');
    }
  };

  const updateStatus = async (appointment, newStatus) => {
    try {
      await api.put(`/appointments/${appointment.id}`, {
        donor: appointment.donor ? { id: appointment.donor.id } : undefined,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        remarks: appointment.remarks,
        status: newStatus,
      });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to update appointment.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this appointment?')) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchAppointments();
      } catch {
        alert('Failed to delete appointment.');
      }
    }
  };

  const getStatusBadge = (s) => {
    const map = { Completed: 'success', Cancelled: 'danger' };
    return <span className={`badge ${map[s] || 'info'}`}>{s || 'Scheduled'}</span>;
  };

  const renderAppointmentForm = (onSubmit, submitLabel, onCancel, dateMin) => (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Select Donor *</label>
        <select value={donorId} onChange={(e) => setDonorId(e.target.value)} required>
          {donors.map((d) => (
            <option key={d.id} value={d.id}>{d.fullName} ({d.bloodGroup?.groupName || '?'})</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={appointmentDate} min={dateMin} onChange={(e) => setAppointmentDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Time *</label>
          <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} required />
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
        title="Donation Appointments"
        subtitle="Manage calendar slots and donor attendance"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Appointments' }]}
        actions={
          <button type="button" onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary" disabled={donors.length === 0}>
            <RiAddLine size={16} /> Schedule Appointment
          </button>
        }
      />

      {donors.length === 0 && (
        <div className="alert alert-danger">Register at least one active donor before booking appointments.</div>
      )}

      <div className="card">
        <div className="filters-bar">
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="all">All Appointments</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading appointments..." />
        ) : (
          <div className="nowa-table-container">
            <table className="nowa-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="text-center">No appointments found.</td></tr>
                ) : (
                  filtered.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="avatar-group-item">
                          <img src={app.donor?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} className="avatar-small" alt="" />
                          <span>{app.donor?.fullName || 'N/A'}</span>
                        </div>
                      </td>
                      <td><span className="badge info">{app.donor?.bloodGroup?.groupName || 'N/A'}</span></td>
                      <td>{app.appointmentDate}</td>
                      <td>{app.appointmentTime?.substring(0, 5)}</td>
                      <td>{app.remarks || '—'}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>
                        <div className="action-btn-group">
                          {isScheduled(app.status) && (
                            <>
                              <button type="button" onClick={() => updateStatus(app, 'Completed')} className="icon-btn success" title="Mark completed">
                                <RiCheckLine size={16} />
                              </button>
                              <button type="button" onClick={() => updateStatus(app, 'Cancelled')} className="icon-btn danger" title="Cancel">
                                <RiCloseLine size={16} />
                              </button>
                              <button type="button" onClick={() => handleOpenEdit(app)} className="icon-btn" title="Edit">
                                <RiEditLine size={16} />
                              </button>
                            </>
                          )}
                          <button type="button" onClick={() => handleDelete(app.id)} className="icon-btn danger" title="Delete">
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
              <h2>Schedule Donation Appointment</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderAppointmentForm(handleAddAppointment, 'Book Slot', () => setShowAddModal(false), today)}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Edit Appointment</h2>
              <button type="button" className="modal-close-btn" onClick={() => { setShowEditModal(false); resetForm(); }}>&times;</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {renderAppointmentForm(handleEditAppointment, 'Save Changes', () => { setShowEditModal(false); resetForm(); }, undefined)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
