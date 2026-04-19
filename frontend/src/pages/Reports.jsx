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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Reports</h1>
        <Button size="sm" onClick={() => navigate('/reports/new')}>+ New Report</Button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : reports.length === 0 ? (
        <EmptyState title="No reports" description="Submit your first grassroots report" icon="📋" action={<Button size="sm" onClick={() => navigate('/reports/new')}>Create Report</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {reports.map(r => (
            <Card key={r.id} padding="md" className="report-item">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge>
                <span className="text-[0.8rem] text-gray-400 font-mono">{r.report_period}</span>
              </div>
              <h3 className="text-base font-bold mb-1">{r.report_level} Report</h3>
              <p className="text-[0.85rem] text-gray-500 leading-relaxed mb-2">
                {r.summary_of_activities ? r.summary_of_activities.slice(0, 100) + '...' : <span style={{ color: 'var(--color-gray-400)' }}>No summary yet</span>}
              </p>
              <div className="flex gap-4 text-[0.8rem] text-gray-400">
                <span>New: {r.membership_new}</span>
                <span>Total: {r.membership_total}</span>
                <span>Events: {r.events_held}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
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
