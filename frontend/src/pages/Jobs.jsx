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
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1>Job Board</h1>
        <div className="flex gap-2 flex-wrap">
          {user?.voter_verification_status === 'APPROVED' && (
            <Button size="sm" onClick={() => navigate('/jobs/create')}>Post a Job</Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => navigate('/jobs/my-listings')}>My Listings</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/jobs/my-applications')}>My Applications</Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/jobs/saved')}>Saved</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-4 items-start md:items-center">
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:flex-1 md:min-w-[200px] py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]"
        />
        <select value={jobType} onChange={e => setJobType(e.target.value)} className="py-2 px-4 border border-gray-200 rounded-lg text-sm min-w-[130px]">
          <option value="">All Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <select value={workMode} onChange={e => setWorkMode(e.target.value)} className="py-2 px-4 border border-gray-200 rounded-lg text-sm min-w-[130px]">
          <option value="">All Modes</option>
          {WORK_MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={expLevel} onChange={e => setExpLevel(e.target.value)} className="py-2 px-4 border border-gray-200 rounded-lg text-sm min-w-[130px]">
          <option value="">Any Level</option>
          {EXP_LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
        </select>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="py-2 px-4 border border-gray-200 rounded-lg text-sm min-w-[130px]">
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
          Remote Only
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Try adjusting your filters or check back later" icon="💼" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all relative hover:shadow-elevated hover:-translate-y-0.5" onClick={() => navigate(`/jobs/${job.id}`)}>
                <button className="absolute top-3 right-3 bg-transparent border-none cursor-pointer text-xl" onClick={e => handleSave(e, job.id)} aria-label={job.is_saved ? 'Unsave' : 'Save'}>
                  {job.is_saved ? '🔖' : '🏷️'}
                </button>
                <h3 className="font-semibold text-[1.05rem] m-0 mb-1">{job.title}</h3>
                <p className="text-gray-500 text-sm">{job.company_name}</p>
                <div className="flex gap-1.5 flex-wrap my-2">
                  <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-blue-100 text-blue-700">{(job.job_type || '').replace('_', ' ')}</span>
                  <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-amber-100 text-amber-800">{job.work_mode}</span>
                  {job.experience_level && job.experience_level !== 'ANY' && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800">{job.experience_level}</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-[0.85rem] mt-2">
                  {job.location && <span>📍 {job.location}</span>}
                  {job.is_remote && <span>🌐 Remote</span>}
                  <span>{timeAgo(job.created_at)}</span>
                </div>
                {job.salary_display ? (
                  <p className="font-semibold text-forest text-sm mt-2">{job.salary_display}</p>
                ) : job.salary_min ? (
                  <p className="font-semibold text-forest text-sm mt-2">₦{Number(job.salary_min).toLocaleString()}{job.salary_max ? ` - ₦${Number(job.salary_max).toLocaleString()}` : ''} / {job.salary_period}</p>
                ) : null}
                {(job.skills || []).length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1.5">
                    {job.skills.slice(0, 3).map(s => <span key={s.id || s} className="px-1.5 py-px rounded-lg text-[0.7rem] bg-gray-100 text-gray-700">{s.name || s}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="secondary" onClick={() => { setPage(p => p + 1); fetchJobs(false); }}>Load More</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
