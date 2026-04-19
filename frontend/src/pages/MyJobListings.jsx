import { cn } from '../lib/cn';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyJobListings, deleteJobListing, changeJobStatus } from '../api/client';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

const STATUS_TABS = ['All', 'DRAFT', 'OPEN', 'PAUSED', 'CLOSED'];

const JOB_STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-indigo-100 text-indigo-700',
  shortlisted: 'bg-amber-100 text-amber-800',
  interview: 'bg-emerald-100 text-emerald-800',
  offered: 'bg-emerald-50 text-emerald-700',
  hired: 'bg-[#065f46] text-white',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-500',
  draft: 'bg-gray-100 text-gray-500',
  open: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-amber-100 text-amber-800',
  closed: 'bg-red-100 text-red-800',
};

export default function MyJobListings() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyJobListings();
      setJobs(res.data.data?.results || res.data.data || res.data.results || res.data || []);
    } catch { setJobs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = tab === 'All' ? jobs : jobs.filter(j => j.status === tab);

  const handleStatus = async (jobId, status) => {
    try {
      await changeJobStatus(jobId, { status });
      addToast({ type: 'success', message: `Status changed to ${status}` });
      load();
    } catch (e) { addToast({ type: 'error', message: e.response?.data?.message || 'Failed' }); }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Delete this job listing?')) return;
    try { await deleteJobListing(jobId); addToast({ type: 'success', message: 'Job deleted' }); load(); }
    catch (e) { addToast({ type: 'error', message: e.response?.data?.message || 'Cannot delete' }); }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1>My Job Listings</h1>
        <Button size="sm" onClick={() => navigate('/jobs/create')}>Post New Job</Button>
      </div>

      <div className="flex gap-1 mb-6 border-b-2 border-gray-200 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t} className={cn('py-2 px-4 border-none bg-transparent cursor-pointer font-semibold text-gray-500 border-b-2 border-transparent -mb-[2px] whitespace-nowrap transition-colors', tab === t && 'text-forest border-b-forest')} onClick={() => setTab(t)}>
            {t === 'All' ? 'All' : t}
            {t !== 'All' && <span className="inline-block bg-forest text-white rounded-[10px] px-1.5 text-[0.7rem] ml-1">{jobs.filter(j => j.status === t).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No job listings" description={tab === 'All' ? 'Post your first job to get started' : `No ${tab.toLowerCase()} jobs`} icon="📋" />
      ) : (
        filtered.map(job => (
          <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 200, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                <h3 style={{ margin: 0 }}>{job.title}</h3>
                <p style={{ color: '#6b7280', margin: '2px 0' }}>{job.company_name}</p>
                <div className="flex gap-1.5 flex-wrap my-2" style={{ marginTop: 8 }}>
                  <span className={cn('px-2.5 py-0.5 rounded-xl text-xs font-semibold', JOB_STATUS_COLORS[job.status?.toLowerCase()])}>{job.status}</span>
                  <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800">{job.application_count || 0} applications</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Button size="sm" onClick={() => navigate(`/jobs/edit/${job.id}`)}>Edit</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/jobs/my-listings/${job.id}/applications`)}>Applications</Button>
                {job.status === 'DRAFT' && <Button size="sm" onClick={() => handleStatus(job.id, 'OPEN')}>Publish</Button>}
                {job.status === 'OPEN' && <Button size="sm" variant="secondary" onClick={() => handleStatus(job.id, 'PAUSED')}>Pause</Button>}
                {job.status === 'PAUSED' && <Button size="sm" onClick={() => handleStatus(job.id, 'OPEN')}>Resume</Button>}
                {job.status !== 'CLOSED' && <Button size="sm" variant="danger" onClick={() => handleStatus(job.id, 'CLOSED')}>Close</Button>}
                {(job.status === 'DRAFT' || (job.application_count || 0) === 0) && (
                  <Button size="sm" variant="danger" onClick={() => handleDelete(job.id)}>Delete</Button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
