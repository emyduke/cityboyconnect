import './Jobs.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedJobs, saveJob } from '../api/client';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function SavedJobs() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSavedJobs();
        setSaved(res.data.data?.results || res.data.data || res.data.results || []);
      } catch { setSaved([]); }
      setLoading(false);
    };
    load();
  }, []);

  const handleUnsave = async (jobId) => {
    try {
      await saveJob(jobId);
      setSaved(saved.filter(s => (s.job?.id || s.job_id) !== jobId));
      addToast({ type: 'success', message: 'Job unsaved' });
    } catch { addToast({ type: 'error', message: 'Failed' }); }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-page__header">
        <h1>Saved Jobs</h1>
        <Button size="sm" variant="secondary" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
      </div>

      {loading ? (
        <div><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : saved.length === 0 ? (
        <EmptyState
          title="No saved jobs"
          description="Browse the job board and save interesting positions"
          icon="🔖"
          action={<Button onClick={() => navigate('/jobs')}>Browse Job Board</Button>}
        />
      ) : (
        saved.map(item => {
          const job = item.job || item;
          const jobId = job.id || item.job_id;
          return (
            <div key={item.id || jobId} className="app-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${jobId}`)}>
                  <h3 style={{ margin: 0 }}>{job.title || 'Job'}</h3>
                  <p style={{ color: '#6b7280', margin: '2px 0' }}>{job.company_name || job.company}</p>
                  <div className="job-card__badges" style={{ marginTop: 4 }}>
                    {job.job_type && <span className="job-card__badge job-card__badge--type">{(job.job_type || '').replace('_', ' ')}</span>}
                    {job.location && <span className="job-card__badge">📍 {job.location}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" onClick={() => navigate(`/jobs/${jobId}`)}>View</Button>
                  <Button size="sm" variant="danger" onClick={() => handleUnsave(jobId)}>Unsave</Button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
