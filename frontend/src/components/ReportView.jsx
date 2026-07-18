import React, { useEffect, useState } from 'react';
import { RiDownloadLine, RiPrinterLine, RiSearchLine } from 'react-icons/ri';
import api from '../services/api';
import PageHeader from './PageHeader';
import LoadingSpinner from './LoadingSpinner';
import { downloadCsv, printReport } from '../utils/reports';

const REPORT_META = {
  donations: {
    title: 'Donation Report',
    subtitle: 'Blood collection records with donor and volume details',
    api: '/donations',
    slug: 'donations',
  },
  inventory: {
    title: 'Inventory Report',
    subtitle: 'Blood bag stock levels, expiry dates, and storage status',
    api: '/inventory',
    slug: 'inventory',
  },
  requests: {
    title: 'Blood Request Report',
    subtitle: 'Hospital requests with priority, status, and issued units',
    api: '/requests',
    slug: 'requests',
  },
  hospitals: {
    title: 'Hospital Report',
    subtitle: 'Partner hospital directory and contact information',
    api: '/hospitals',
    slug: 'hospitals',
  },
};

const inDateRange = (date, from, to) => {
  if (!date) return !from && !to;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

const ReportView = ({ type }) => {
  const meta = REPORT_META[type];
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({ headers: [], rows: [], title: meta.title });
  const [message, setMessage] = useState('');
  const [bloodGroups, setBloodGroups] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [donationDateFrom, setDonationDateFrom] = useState('');
  const [donationDateTo, setDonationDateTo] = useState('');
  const [donationBloodGroup, setDonationBloodGroup] = useState('all');

  const [inventoryStatus, setInventoryStatus] = useState('all');
  const [inventoryBloodGroup, setInventoryBloodGroup] = useState('all');
  const [expiryBefore, setExpiryBefore] = useState('');

  const [requestStatus, setRequestStatus] = useState('all');
  const [requestPriority, setRequestPriority] = useState('all');
  const [requestHospital, setRequestHospital] = useState('all');
  const [requestDateFrom, setRequestDateFrom] = useState('');
  const [requestDateTo, setRequestDateTo] = useState('');

  const [hospitalStatus, setHospitalStatus] = useState('all');

  useEffect(() => {
    setPreview({ headers: [], rows: [], title: meta.title });
    setMessage('');
  }, [type, meta.title]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        if (type === 'donations' || type === 'inventory') {
          const bgRes = await api.get('/blood-groups');
          setBloodGroups(bgRes.data);
        }
        if (type === 'requests') {
          const [bgRes, hospRes] = await Promise.all([
            api.get('/blood-groups'),
            api.get('/hospitals'),
          ]);
          setBloodGroups(bgRes.data);
          setHospitals(hospRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadMeta();
  }, [type]);

  const buildReport = (data) => {
    if (type === 'donations') {
      const headers = ['Donation ID', 'Donor', 'Blood Group', 'Date', 'Units (L)', 'Doctor', 'Remarks'];
      const filtered = data.filter((d) => {
        const bg = d.donor?.bloodGroup?.groupName;
        const matchBg = donationBloodGroup === 'all' || bg === donationBloodGroup;
        const matchDate = inDateRange(d.donationDate, donationDateFrom, donationDateTo);
        return matchBg && matchDate;
      });
      return {
        title: meta.title,
        headers,
        rows: filtered.map((d) => [
          d.id?.substring(0, 8) + '...',
          d.donor?.fullName || '',
          d.donor?.bloodGroup?.groupName || '',
          d.donationDate,
          d.units,
          d.doctorName || '',
          d.remarks || '',
        ]),
        count: filtered.length,
      };
    }

    if (type === 'inventory') {
      const headers = ['Bag Number', 'Blood Group', 'Units', 'Collection', 'Expiry', 'Location', 'Status'];
      const filtered = data.filter((i) => {
        const matchStatus = inventoryStatus === 'all' || i.status === inventoryStatus;
        const matchBg = inventoryBloodGroup === 'all' || i.bloodGroup?.groupName === inventoryBloodGroup;
        const matchExpiry = !expiryBefore || (i.expiryDate && i.expiryDate <= expiryBefore);
        return matchStatus && matchBg && matchExpiry;
      });
      return {
        title: meta.title,
        headers,
        rows: filtered.map((i) => [
          i.bloodBagNumber,
          i.bloodGroup?.groupName || '',
          i.units,
          i.collectionDate,
          i.expiryDate,
          i.location || '',
          i.status,
        ]),
        count: filtered.length,
      };
    }

    if (type === 'requests') {
      const headers = ['Request ID', 'Hospital', 'Date', 'Priority', 'Status', 'Blood Group', 'Requested', 'Issued', 'Requested By'];
      const rows = [];
      data.forEach((r) => {
        const matchStatus = requestStatus === 'all' || r.status === requestStatus;
        const matchPriority = requestPriority === 'all' || r.priority === requestPriority;
        const matchHospital = requestHospital === 'all' || r.hospital?.id === requestHospital;
        const matchDate = inDateRange(r.requestDate, requestDateFrom, requestDateTo);
        if (!matchStatus || !matchPriority || !matchHospital || !matchDate) return;

        (r.items || []).forEach((item) => {
          rows.push([
            r.id?.substring(0, 8) + '...',
            r.hospital?.hospitalName || '',
            r.requestDate,
            r.priority,
            r.status,
            item.bloodGroup?.groupName || '',
            item.requestedUnits,
            item.issuedUnits,
            r.requestedBy || '',
          ]);
        });
        if (!r.items?.length) {
          rows.push([r.id?.substring(0, 8) + '...', r.hospital?.hospitalName || '', r.requestDate, r.priority, r.status, '', '', '', r.requestedBy || '']);
        }
      });
      return { title: meta.title, headers, rows, count: rows.length };
    }

    const headers = ['Code', 'Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Status'];
    const filtered = data.filter((h) => {
      if (hospitalStatus === 'all') return true;
      if (hospitalStatus === 'active') return h.status;
      return !h.status;
    });
    return {
      title: meta.title,
      headers,
      rows: filtered.map((h) => [
        h.hospitalCode,
        h.hospitalName,
        h.contactPerson || '',
        h.phone,
        h.email || '',
        h.address || '',
        h.status ? 'Active' : 'Suspended',
      ]),
      count: filtered.length,
    };
  };

  const generatePreview = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.get(meta.api);
      const report = buildReport(res.data);
      setPreview(report);
      setMessage(`${report.count} record(s) matched your filters.`);
    } catch {
      setMessage('Failed to generate report preview.');
      setPreview({ headers: [], rows: [], title: meta.title });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!preview.rows.length) {
      setMessage('Generate a preview first.');
      return;
    }
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(`${type}-report-${date}.csv`, preview.headers, preview.rows);
  };

  const handlePrint = () => {
    if (!preview.rows.length) {
      setMessage('Generate a preview first.');
      return;
    }
    printReport(preview.title, preview.headers, preview.rows, message);
  };

  const renderFilters = () => {
    if (type === 'donations') {
      return (
        <>
          <input type="date" value={donationDateFrom} onChange={(e) => setDonationDateFrom(e.target.value)} title="From date" />
          <input type="date" value={donationDateTo} onChange={(e) => setDonationDateTo(e.target.value)} title="To date" />
          <select value={donationBloodGroup} onChange={(e) => setDonationBloodGroup(e.target.value)}>
            <option value="all">All Blood Groups</option>
            {bloodGroups.map((bg) => <option key={bg.id} value={bg.groupName}>{bg.groupName}</option>)}
          </select>
        </>
      );
    }
    if (type === 'inventory') {
      return (
        <>
          <select value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
            <option value="Expired">Expired</option>
          </select>
          <select value={inventoryBloodGroup} onChange={(e) => setInventoryBloodGroup(e.target.value)}>
            <option value="all">All Blood Groups</option>
            {bloodGroups.map((bg) => <option key={bg.id} value={bg.groupName}>{bg.groupName}</option>)}
          </select>
          <input type="date" value={expiryBefore} onChange={(e) => setExpiryBefore(e.target.value)} title="Expiry before" />
        </>
      );
    }
    if (type === 'requests') {
      return (
        <>
          <select value={requestStatus} onChange={(e) => setRequestStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={requestPriority} onChange={(e) => setRequestPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <select value={requestHospital} onChange={(e) => setRequestHospital(e.target.value)}>
            <option value="all">All Hospitals</option>
            {hospitals.map((h) => <option key={h.id} value={h.id}>{h.hospitalName}</option>)}
          </select>
          <input type="date" value={requestDateFrom} onChange={(e) => setRequestDateFrom(e.target.value)} />
          <input type="date" value={requestDateTo} onChange={(e) => setRequestDateTo(e.target.value)} />
        </>
      );
    }
    return (
      <select value={hospitalStatus} onChange={(e) => setHospitalStatus(e.target.value)}>
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
    );
  };

  return (
    <div>
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Reports', to: '/reports/donations' },
          { label: meta.title },
        ]}
      />

      <div className="card">
        <h2 className="card-section-title" style={{ marginBottom: '14px' }}>Filters</h2>
        <div className="filters-bar">
          {renderFilters()}
          <button type="button" className="btn-primary" onClick={generatePreview} disabled={loading}>
            <RiSearchLine size={16} />
            {loading ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>

        {message && (
          <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>{message}</div>
        )}

        {loading ? (
          <LoadingSpinner message="Building report..." />
        ) : preview.headers.length > 0 && (
          <>
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h3 className="card-section-title" style={{ textTransform: 'none' }}>{preview.title}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-secondary btn-sm" onClick={handlePrint} disabled={!preview.rows.length}>
                  <RiPrinterLine size={16} /> Print
                </button>
                <button type="button" className="btn-primary btn-sm" onClick={handleExport} disabled={!preview.rows.length}>
                  <RiDownloadLine size={16} /> Export CSV
                </button>
              </div>
            </div>
            <div className="nowa-table-container report-preview-table">
              <table className="nowa-table">
                <thead>
                  <tr>{preview.headers.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.length === 0 ? (
                    <tr><td colSpan={preview.headers.length} className="text-center">No records match the selected filters.</td></tr>
                  ) : (
                    preview.rows.map((row, idx) => (
                      <tr key={idx}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportView;
