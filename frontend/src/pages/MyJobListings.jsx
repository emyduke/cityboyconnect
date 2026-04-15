import './Jobs.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyJobListings, deleteJobListing, changeJobStatus } from '../api/client';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

const STATUS_TABS = ['All', 'DRAFT', 'OPEN', 'PAUSED', 'CLOSED'];

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
    <div className="jobs-page">
      <div className="jobs-page__header">
        <h1>My Job Listings</h1>
        <Button size="sm" onClick={() => navigate('/jobs/create')}>Post New Job</Button>
      </div>

      <div className="job-tabs">
        {STATUS_TABS.map(t => (
          <button key={t} className={`job-tabs__tab ${tab === t ? 'job-tabs__tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'All' ? 'All' : t}
            {t !== 'All' && <span className="badge-count">{jobs.filter(j => j.status === t).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No job listings" description={tab === 'All' ? 'Post your first job to get started' : `No ${tab.toLowerCase()} jobs`} icon="📋" />
      ) : (
        filtered.map(job => (
          <div key={job.id} className="app-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 200, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}>
                <h3 style={{ margin: 0 }}>{job.title}</h3>
                <p style={{ color: '#6b7280', margin: '2px 0' }}>{job.company_name}</p>
                <div className="job-card__badges" style={{ marginTop: 8 }}>
                  <span className={`status-badge status-badge--${job.status?.toLowerCase()}`}>{job.status}</span>
                  <span className="job-card__badge">{job.application_count || 0} applications</span>
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
