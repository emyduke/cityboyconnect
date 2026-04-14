import './Reports.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports, submitReport } from '../api/client';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useToastStore } from '../store/toastStore';
import { getFriendlyError } from '../lib/errors';

const statusVariant = { DRAFT: 'default', SUBMITTED: 'info', ACKNOWLEDGED: 'warning', REVIEWED: 'success' };

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);

  const load = async () => {
    try {
      const res = await getReports();
      setReports(res.data.data || res.data.results || res.data || []);
    } catch { /* ok */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (id) => {
    setSubmitting(id);
    try {
      await submitReport(id);
      addToast({ type: 'success', message: 'Report submitted successfully!' });
      load();
    } catch (err) {
      const apiError = err?.response?.data?.error;
      addToast({ type: 'error', message: apiError?.message || getFriendlyError(err) });
    }
    setSubmitting(null);
  };

  return (
    <div className="reports-page">
      <div className="reports-page__header">
        <h1>Reports</h1>
        <Button size="sm" onClick={() => navigate('/reports/new')}>+ New Report</Button>
      </div>
      {loading ? (
        <div className="reports-grid"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : reports.length === 0 ? (
        <EmptyState title="No reports" description="Submit your first grassroots report" icon="📋" action={<Button size="sm" onClick={() => navigate('/reports/new')}>Create Report</Button>} />
      ) : (
        <div className="reports-grid">
          {reports.map(r => (
            <Card key={r.id} padding="md" className="report-item">
              <div className="report-item__header">
                <Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge>
                <span className="report-item__period">{r.report_period}</span>
              </div>
              <h3 className="report-item__level">{r.report_level} Report</h3>
              <p className="report-item__summary">
                {r.summary_of_activities ? r.summary_of_activities.slice(0, 100) + '...' : <span style={{ color: 'var(--color-gray-400)' }}>No summary yet</span>}
              </p>
              <div className="report-item__stats">
                <span>New: {r.membership_new}</span>
                <span>Total: {r.membership_total}</span>
                <span>Events: {r.events_held}</span>
              </div>
              <div className="report-item__actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                {r.status === 'DRAFT' ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/reports/${r.id}/edit`)}>Edit Draft</Button>
                    <Button size="sm" onClick={() => handleSubmit(r.id)} loading={submitting === r.id}>Submit</Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/reports/${r.id}/edit`)}>View</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
