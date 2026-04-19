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
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
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
            <div key={item.id || jobId} className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${jobId}`)}>
                  <h3 style={{ margin: 0 }}>{job.title || 'Job'}</h3>
                  <p style={{ color: '#6b7280', margin: '2px 0' }}>{job.company_name || job.company}</p>
                  <div className="flex gap-1.5 flex-wrap my-2" style={{ marginTop: 4 }}>
                    {job.job_type && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-blue-100 text-blue-700">{(job.job_type || '').replace('_', ' ')}</span>}
                    {job.location && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800">📍 {job.location}</span>}
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
