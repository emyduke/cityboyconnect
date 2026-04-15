import './Jobs.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetail, applyToJob, saveJob, withdrawApplication, getMyProfessionalProfile } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Card from '../components/Card';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [useProfileCv, setUseProfileCv] = useState(false);
  const [hasProfileCv, setHasProfileCv] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getJobDetail(id);
        setJob(res.data.data || res.data);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
    getMyProfessionalProfile()
      .then(r => { if (r.data?.data?.cv_url || r.data?.cv_url) setHasProfileCv(true); })
      .catch(() => {});
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const fd = new FormData();
      if (coverLetter) fd.append('cover_letter', coverLetter);
      if (useProfileCv) fd.append('use_profile_cv', 'true');
      else if (cvFile) fd.append('cv_file', cvFile);
      await applyToJob(id, fd);
      setJob({ ...job, has_applied: true });
      setShowApply(false);
      addToast({ type: 'success', message: 'Application submitted!' });
    } catch (e) {
      addToast({ type: 'error', message: e.response?.data?.message || 'Failed to apply' });
    }
    setApplying(false);
  };

  const handleSave = async () => {
    try {
      const res = await saveJob(id);
      setJob({ ...job, is_saved: res.data.data?.saved ?? res.data.saved });
    } catch { addToast({ type: 'error', message: 'Failed to save' }); }
  };

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton variant="card" /><Skeleton variant="text" width="60%" /></div>;
  if (!job) return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Job not found</h2><Button onClick={() => navigate(-1)}>Go Back</Button></div>;

  const isOwner = job.posted_by?.id === user?.id;
  const deadline = job.application_deadline ? new Date(job.application_deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86400000) : null;

  return (
    <div className="job-detail">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back</button>

      <Card padding="lg">
        <h1 style={{ margin: 0 }}>{job.title}</h1>
        <p style={{ color: '#6b7280', fontSize: '1.05rem', margin: '4px 0' }}>{job.company_name}</p>
        {job.posted_by && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Posted by</span>
            <span style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }} onClick={() => navigate(`/members/${job.posted_by.id}`)}>
              {job.posted_by.full_name}
            </span>
            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>· {timeAgo(job.created_at)}</span>
          </div>
        )}

        <div className="job-card__badges" style={{ marginTop: 12 }}>
          <span className="job-card__badge job-card__badge--type">{(job.job_type || '').replace('_', ' ')}</span>
          <span className="job-card__badge job-card__badge--mode">{job.work_mode}</span>
          {job.experience_level && job.experience_level !== 'ANY' && <span className="job-card__badge">{job.experience_level_display || job.experience_level}</span>}
          {job.location && <span className="job-card__badge">📍 {job.location}</span>}
          {job.is_remote && <span className="job-card__badge">🌐 Remote</span>}
        </div>

        {job.salary_display ? (
          <p className="job-card__salary" style={{ fontSize: '1.1rem' }}>{job.salary_display}</p>
        ) : job.salary_min ? (
          <p className="job-card__salary" style={{ fontSize: '1.1rem' }}>₦{Number(job.salary_min).toLocaleString()}{job.salary_max ? ` - ₦${Number(job.salary_max).toLocaleString()}` : ''} / {job.salary_period}</p>
        ) : null}
      </Card>

      {(job.skills || []).length > 0 && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Skills Required</h3>
          <div className="opportunity-card__badges">
            {job.skills.map(s => <span key={s.id || s} className="opportunity-card__badge">{s.name || s}</span>)}
          </div>
        </Card>
      )}

      <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
        <h3>Description</h3>
        <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{job.description}</p>
      </Card>

      {job.requirements && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Requirements</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{job.requirements}</p>
        </Card>
      )}

      <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            {deadline && <p style={{ color: '#6b7280' }}>Deadline: {deadline.toLocaleDateString()} {daysLeft !== null && daysLeft > 0 ? `(${daysLeft} days left)` : daysLeft === 0 ? '(Today)' : '(Expired)'}</p>}
            <p style={{ color: '#6b7280' }}>{job.application_count || 0} application(s)</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isOwner ? (
              <>
                <Button size="sm" onClick={() => navigate(`/jobs/edit/${job.id}`)}>Edit Job</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/jobs/my-listings/${job.id}/applications`)}>Manage Applications</Button>
              </>
            ) : (
              <>
                {!job.has_applied ? (
                  <Button onClick={() => setShowApply(!showApply)} disabled={!job.is_accepting_applications}>
                    {job.is_accepting_applications ? 'Apply Now' : 'Not Accepting'}
                  </Button>
                ) : (
                  <span className="status-badge status-badge--applied">Applied ✓</span>
                )}
                <Button variant="secondary" onClick={handleSave}>{job.is_saved ? '🔖 Saved' : '🏷️ Save'}</Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {showApply && (
        <div className="job-detail__apply-form">
          <h3>Apply for this position</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Cover Letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              maxLength={3000}
              rows={5}
              style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, resize: 'vertical' }}
              placeholder="Tell the recruiter why you're a great fit..."
            />
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'right' }}>{coverLetter.length}/3000</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>CV</label>
            {hasProfileCv && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="radio" name="cv-choice" checked={useProfileCv} onChange={() => { setUseProfileCv(true); setCvFile(null); }} />
                Use my profile CV
              </label>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="radio" name="cv-choice" checked={!useProfileCv} onChange={() => setUseProfileCv(false)} />
              Upload new CV
            </label>
            {!useProfileCv && (
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0])} style={{ marginTop: 8 }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleApply} disabled={applying}>{applying ? 'Submitting...' : 'Submit Application'}</Button>
            <Button variant="secondary" onClick={() => setShowApply(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
