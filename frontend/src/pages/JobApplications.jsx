import { cn } from '../lib/cn';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobApplications, updateApplicationStatus, getJobDetail } from '../api/client';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

const STATUS_TABS = ['All', 'APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'];
const STATUS_TRANSITIONS = {
  APPLIED: ['REVIEWED', 'SHORTLISTED', 'REJECTED'],
  REVIEWED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFERED', 'REJECTED'],
  OFFERED: ['HIRED', 'REJECTED'],
};

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

export default function JobApplications() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [jobRes, appsRes] = await Promise.all([
        getJobDetail(jobId),
        getJobApplications(jobId),
      ]);
      setJob(jobRes.data.data || jobRes.data);
      setApps(appsRes.data.data?.results || appsRes.data.data || appsRes.data.results || []);
    } catch { /* ok */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [jobId]);

  const filtered = tab === 'All' ? apps : apps.filter(a => a.status === tab);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(jobId, appId, { status: newStatus });
      addToast({ type: 'success', message: `Status updated to ${newStatus}` });
      load();
    } catch (e) { addToast({ type: 'error', message: e.response?.data?.message || 'Failed' }); }
  };

  const handleNotesUpdate = async (appId, notes) => {
    try {
      await updateApplicationStatus(jobId, appId, { recruiter_notes: notes });
    } catch { /* silent */ }
  };

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton variant="card" /><Skeleton variant="card" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back</button>
      {job && <h1>Applications for {job.title} at {job.company_name}</h1>}

      <div className="flex gap-1 mb-6 border-b-2 border-gray-200 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t} className={cn('py-2 px-4 border-none bg-transparent cursor-pointer font-semibold text-gray-500 border-b-2 border-transparent -mb-[2px] whitespace-nowrap transition-colors', tab === t && 'text-forest border-b-forest')} onClick={() => setTab(t)}>
            {t === 'All' ? 'All' : t}
            {t !== 'All' && <span className="inline-block bg-forest text-white rounded-[10px] px-1.5 text-[0.7rem] ml-1">{apps.filter(a => a.status === t).length}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No applications" description={tab === 'All' ? 'No one has applied yet' : `No ${tab.toLowerCase()} applications`} icon="📄" />
      ) : (
        filtered.map(app => {
          const applicant = app.applicant || {};
          const transitions = STATUS_TRANSITIONS[app.status] || [];
          const isExpanded = expanded === app.id;
          return (
            <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
              <div className="flex items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : app.id)}>
                {applicant.profile_photo ? (
                  <img src={applicant.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full object-cover bg-gray-200" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                )}
                <div style={{ flex: 1 }}>
                  <strong>{applicant.full_name}</strong>
                  {app.headline && <p style={{ color: '#6b7280', margin: 0, fontSize: '0.85rem' }}>{app.headline}</p>}
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-xl text-xs font-semibold', JOB_STATUS_COLORS[app.status?.toLowerCase()])}>{app.status}</span>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  {app.cover_letter && (
                    <div style={{ marginBottom: 12 }}>
                      <strong>Cover Letter</strong>
                      <p style={{ color: '#374151', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{app.cover_letter}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {app.cv_url && (
                      <Button size="sm" onClick={() => window.open(app.cv_url, '_blank', 'noopener,noreferrer')}>View CV</Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/members/${applicant.id}`)}>View Profile</Button>
                  </div>

                  {transitions.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ fontSize: '0.85rem' }}>Change Status:</strong>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {transitions.map(s => (
                          <Button key={s} size="sm" variant={s === 'REJECTED' ? 'danger' : 'secondary'} onClick={() => handleStatusChange(app.id, s)}>
                            {s}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>Recruiter Notes (private)</strong>
                    <textarea
                      defaultValue={app.recruiter_notes || ''}
                      rows={2}
                      onBlur={e => handleNotesUpdate(app.id, e.target.value)}
                      style={{ width: '100%', marginTop: 4, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, resize: 'vertical', fontSize: '0.9rem' }}
                      placeholder="Add private notes about this applicant..."
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
