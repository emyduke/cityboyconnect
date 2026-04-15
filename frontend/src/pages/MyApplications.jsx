import './Jobs.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyApplications, withdrawApplication } from '../api/client';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

const TABS = [
  { key: 'All', label: 'All' },
  { key: 'Active', label: 'Active', statuses: ['APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW'] },
  { key: 'Offered', label: 'Offered', statuses: ['OFFERED'] },
  { key: 'Closed', label: 'Closed', statuses: ['REJECTED', 'WITHDRAWN', 'HIRED'] },
];
const WITHDRAWABLE = ['APPLIED', 'REVIEWED', 'SHORTLISTED'];

export default function MyApplications() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyApplications();
      setApps(res.data.data?.results || res.data.data || res.data.results || []);
    } catch { setApps([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const tabObj = TABS.find(t => t.key === tab);
  const filtered = tab === 'All' ? apps : apps.filter(a => tabObj?.statuses?.includes(a.status));

  const handleWithdraw = async (appId) => {
    if (!confirm('Withdraw this application?')) return;
    try { await withdrawApplication(appId); addToast({ type: 'success', message: 'Application withdrawn' }); load(); }
    catch (e) { addToast({ type: 'error', message: e.response?.data?.message || 'Failed' }); }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-page__header">
        <h1>My Applications</h1>
        <Button size="sm" variant="secondary" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
      </div>

      <div className="job-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`job-tabs__tab ${tab === t.key ? 'job-tabs__tab--active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No applications"
          description={tab === 'All' ? "You haven't applied to any jobs yet." : `No ${tab.toLowerCase()} applications.`}
          icon="📄"
          action={tab === 'All' ? <Button onClick={() => navigate('/jobs')}>Browse Job Board</Button> : null}
        />
      ) : (
        filtered.map(app => {
          const job = app.job || {};
          return (
            <div key={app.id} className="app-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                  <h3 style={{ margin: 0 }}>{job.title || 'Unknown Job'}</h3>
                  <p style={{ color: '#6b7280', margin: '2px 0' }}>{job.company_name}</p>
                  <div className="job-card__badges" style={{ marginTop: 4 }}>
                    {job.job_type && <span className="job-card__badge job-card__badge--type">{(job.job_type || '').replace('_', ' ')}</span>}
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`status-badge status-badge--${app.status?.toLowerCase()}`}>{app.status}</span>
                  {WITHDRAWABLE.includes(app.status) && (
                    <Button size="sm" variant="danger" onClick={() => handleWithdraw(app.id)}>Withdraw</Button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
