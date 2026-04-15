import './Jobs.css';
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
    <div className="jobs-page">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back</button>
      {job && <h1>Applications for {job.title} at {job.company_name}</h1>}

      <div className="job-tabs">
        {STATUS_TABS.map(t => (
          <button key={t} className={`job-tabs__tab ${tab === t ? 'job-tabs__tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'All' ? 'All' : t}
            {t !== 'All' && <span className="badge-count">{apps.filter(a => a.status === t).length}</span>}
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
            <div key={app.id} className="app-card">
              <div className="app-card__header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : app.id)}>
                {applicant.profile_photo ? (
                  <img src={applicant.profile_photo} alt="" className="app-card__avatar" />
                ) : (
                  <div className="app-card__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                )}
                <div style={{ flex: 1 }}>
                  <strong>{applicant.full_name}</strong>
                  {app.headline && <p style={{ color: '#6b7280', margin: 0, fontSize: '0.85rem' }}>{app.headline}</p>}
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
                <span className={`status-badge status-badge--${app.status?.toLowerCase()}`}>{app.status}</span>
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
