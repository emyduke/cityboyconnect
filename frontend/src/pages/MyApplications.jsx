import { cn } from '../lib/cn';
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

const JOB_STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-indigo-100 text-indigo-700',
  shortlisted: 'bg-amber-100 text-amber-800',
  interview: 'bg-emerald-100 text-emerald-800',
  offered: 'bg-emerald-50 text-emerald-700',
  hired: 'bg-[#065f46] text-white',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-500',
};

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
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1>My Applications</h1>
        <Button size="sm" variant="secondary" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
      </div>

      <div className="flex gap-1 mb-6 border-b-2 border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} className={cn('py-2 px-4 border-none bg-transparent cursor-pointer font-semibold text-gray-500 border-b-2 border-transparent -mb-[2px] whitespace-nowrap transition-colors', tab === t.key && 'text-forest border-b-forest')} onClick={() => setTab(t.key)}>
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
            <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                  <h3 style={{ margin: 0 }}>{job.title || 'Unknown Job'}</h3>
                  <p style={{ color: '#6b7280', margin: '2px 0' }}>{job.company_name}</p>
                  <div className="flex gap-1.5 flex-wrap my-2" style={{ marginTop: 4 }}>
                    {job.job_type && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-blue-100 text-blue-700">{(job.job_type || '').replace('_', ' ')}</span>}
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={cn('px-2.5 py-0.5 rounded-xl text-xs font-semibold', JOB_STATUS_COLORS[app.status?.toLowerCase()])}>{app.status}</span>
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
