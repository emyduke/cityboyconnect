import './Jobs.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, saveJob, getStates } from '../api/client';
import { useAuthStore } from '../store/authStore';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useToastStore } from '../store/toastStore';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'VOLUNTEER'];
const WORK_MODES = ['ONSITE', 'REMOTE', 'HYBRID'];
const EXP_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'ANY'];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function Jobs() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [expLevel, setExpLevel] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [states, setStates] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    getStates().then(r => setStates(r.data.data || r.data || [])).catch(() => {});
  }, []);

  const fetchJobs = useCallback(async (resetPage = true) => {
    setLoading(true);
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    const params = { search, page: p };
    if (jobType) params.job_type = jobType;
    if (workMode) params.work_mode = workMode;
    if (expLevel) params.experience_level = expLevel;
    if (stateFilter) params.state = stateFilter;
    if (remoteOnly) params.is_remote = true;
    try {
      const res = await getJobs(params);
      const data = res.data.data?.results || res.data.results || res.data.data || [];
      if (resetPage) setJobs(data);
      else setJobs(prev => [...prev, ...data]);
      setHasMore(!!res.data.data?.next || !!res.data.next);
    } catch { setJobs([]); }
    setLoading(false);
  }, [search, jobType, workMode, expLevel, stateFilter, remoteOnly, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchJobs(true), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, jobType, workMode, expLevel, stateFilter, remoteOnly]);

  const handleSave = async (e, jobId) => {
    e.stopPropagation();
    try {
      const res = await saveJob(jobId);
      const saved = res.data.data?.saved ?? res.data.saved;
      setJobs(jobs.map(j => j.id === jobId ? { ...j, is_saved: saved } : j));
    } catch { addToast({ type: 'error', message: 'Failed to save job' }); }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-page__header">
        <h1>Job Board</h1>
        <div className="jobs-page__actions">
          {user?.voter_verification_status === 'APPROVED' && (
            <Button size="sm" onClick={() => navigate('/jobs/create')}>Post a Job</Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => navigate('/jobs/my-listings')}>My Listings</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/jobs/my-applications')}>My Applications</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/jobs/saved')}>Saved</Button>
        </div>
      </div>

      <div className="jobs-page__filters">
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="jobs-page__search"
        />
        <select value={jobType} onChange={e => setJobType(e.target.value)} className="jobs-page__select">
          <option value="">All Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <select value={workMode} onChange={e => setWorkMode(e.target.value)} className="jobs-page__select">
          <option value="">All Modes</option>
          {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={expLevel} onChange={e => setExpLevel(e.target.value)} className="jobs-page__select">
          <option value="">Any Level</option>
          {EXP_LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
        </select>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="jobs-page__select">
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
          Remote Only
        </label>
      </div>

      {loading ? (
        <div className="jobs-grid"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Try adjusting your filters or check back later" icon="💼" />
      ) : (
        <>
          <div className="jobs-grid">
            {jobs.map(job => (
              <div key={job.id} className="job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                <button className="job-card__save" onClick={e => handleSave(e, job.id)} aria-label={job.is_saved ? 'Unsave' : 'Save'}>
                  {job.is_saved ? '🔖' : '🏷️'}
                </button>
                <h3 className="job-card__title">{job.title}</h3>
                <p className="job-card__company">{job.company_name}</p>
                <div className="job-card__badges">
                  <span className="job-card__badge job-card__badge--type">{(job.job_type || '').replace('_', ' ')}</span>
                  <span className="job-card__badge job-card__badge--mode">{job.work_mode}</span>
                  {job.experience_level && job.experience_level !== 'ANY' && <span className="job-card__badge">{job.experience_level}</span>}
                </div>
                <div className="job-card__meta">
                  {job.location && <span>📍 {job.location}</span>}
                  {job.is_remote && <span>🌐 Remote</span>}
                  <span>{timeAgo(job.created_at)}</span>
                </div>
                {job.salary_display ? (
                  <p className="job-card__salary">{job.salary_display}</p>
                ) : job.salary_min ? (
                  <p className="job-card__salary">₦{Number(job.salary_min).toLocaleString()}{job.salary_max ? ` - ₦${Number(job.salary_max).toLocaleString()}` : ''} / {job.salary_period}</p>
                ) : null}
                {(job.skills || []).length > 0 && (
                  <div className="job-card__skills">
                    {job.skills.slice(0, 3).map(s => <span key={s.id || s} className="job-card__skill-tag">{s.name || s}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="jobs-page__load-more">
              <Button variant="secondary" onClick={() => { setPage(p => p + 1); fetchJobs(false); }}>Load More</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
