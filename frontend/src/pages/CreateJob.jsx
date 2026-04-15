import './Jobs.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createJobListing, updateJobListing, getJobDetail, getSkills, getStates, changeJobStatus } from '../api/client';
import { useToastStore } from '../store/toastStore';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' }, { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' }, { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' }, { value: 'VOLUNTEER', label: 'Volunteer' },
];
const WORK_MODES = [{ value: 'ONSITE', label: 'On-site' }, { value: 'REMOTE', label: 'Remote' }, { value: 'HYBRID', label: 'Hybrid' }];
const EXP_LEVELS = [
  { value: 'ENTRY', label: 'Entry' }, { value: 'MID', label: 'Mid' },
  { value: 'SENIOR', label: 'Senior' }, { value: 'LEAD', label: 'Lead/Manager' }, { value: 'ANY', label: 'Any Level' },
];
const PERIODS = [{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }, { value: 'hourly', label: 'Hourly' }];

export default function CreateJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [skills, setSkillsList] = useState([]);
  const [states, setStates] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', company_name: '', description: '', requirements: '',
    job_type: 'FULL_TIME', work_mode: 'ONSITE', experience_level: 'ANY',
    location: '', state: '', is_remote: false,
    salary_min: '', salary_max: '', salary_currency: 'NGN', salary_period: 'monthly', hide_salary: false,
    skills: [], application_deadline: '', application_email: '', application_url: '',
  });
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  useEffect(() => {
    Promise.all([
      getSkills().catch(() => ({ data: { data: [] } })),
      getStates().catch(() => ({ data: { data: [] } })),
    ]).then(([sk, st]) => {
      setSkillsList(sk.data.data || sk.data || []);
      setStates(st.data.data || st.data || []);
    });

    if (isEdit) {
      getJobDetail(id).then(r => {
        const j = r.data.data || r.data;
        setForm({
          title: j.title || '', company_name: j.company_name || '', description: j.description || '',
          requirements: j.requirements || '', job_type: j.job_type || 'FULL_TIME',
          work_mode: j.work_mode || 'ONSITE', experience_level: j.experience_level || 'ANY',
          location: j.location || '', state: j.state?.id || j.state || '', is_remote: j.is_remote || false,
          salary_min: j.salary_min || '', salary_max: j.salary_max || '',
          salary_currency: j.salary_currency || 'NGN', salary_period: j.salary_period || 'monthly',
          hide_salary: j.hide_salary || false, skills: (j.skills || []).map(s => s.name || s),
          application_deadline: j.application_deadline || '', application_email: j.application_email || '',
          application_url: j.application_url || '',
        });
        setCurrentStatus(j.status || 'DRAFT');
        setLoading(false);
      }).catch(() => { setLoading(false); navigate('/jobs/my-listings'); });
    }
  }, [id, isEdit, navigate]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !form.skills.includes(val)) update('skills', [...form.skills, val]);
    setSkillInput('');
  };

  const handleSave = async (status) => {
    if (!form.title || !form.company_name || !form.description || !form.job_type) {
      addToast({ type: 'error', message: 'Please fill required fields' }); return;
    }
    setSaving(true);
    try {
      const data = { ...form, status, state: form.state || null };
      if (!data.salary_min) { delete data.salary_min; delete data.salary_max; }
      if (isEdit) {
        await updateJobListing(id, data);
        addToast({ type: 'success', message: 'Job updated' });
      } else {
        await createJobListing(data);
        addToast({ type: 'success', message: status === 'OPEN' ? 'Job published!' : 'Draft saved' });
      }
      navigate('/jobs/my-listings');
    } catch (e) {
      addToast({ type: 'error', message: e.response?.data?.message || 'Failed to save' });
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await changeJobStatus(id, { status: newStatus });
      setCurrentStatus(newStatus);
      addToast({ type: 'success', message: `Status changed to ${newStatus}` });
    } catch (e) { addToast({ type: 'error', message: e.response?.data?.message || 'Failed' }); }
  };

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton variant="card" /></div>;

  return (
    <div className="job-form">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back</button>
      <h1>{isEdit ? 'Edit Job Listing' : 'Post a New Job'}</h1>
      {isEdit && <p style={{ color: '#6b7280', marginBottom: 'var(--space-md)' }}>Status: <span className={`status-badge status-badge--${currentStatus.toLowerCase()}`}>{currentStatus}</span></p>}

      <div className="job-form__field">
        <label>Title *</label>
        <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Frontend Developer" />
      </div>
      <div className="job-form__field">
        <label>Company Name *</label>
        <input value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Company or organization name" />
      </div>
      <div className="job-form__field">
        <label>Description *</label>
        <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={6} maxLength={5000} placeholder="Full job description..." />
      </div>
      <div className="job-form__field">
        <label>Requirements</label>
        <textarea value={form.requirements} onChange={e => update('requirements', e.target.value)} rows={4} maxLength={3000} placeholder="Required qualifications..." />
      </div>

      <div className="job-form__row">
        <div className="job-form__field">
          <label>Job Type *</label>
          <select value={form.job_type} onChange={e => update('job_type', e.target.value)}>
            {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="job-form__field">
          <label>Work Mode</label>
          <select value={form.work_mode} onChange={e => update('work_mode', e.target.value)}>
            {WORK_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="job-form__row">
        <div className="job-form__field">
          <label>Experience Level</label>
          <select value={form.experience_level} onChange={e => update('experience_level', e.target.value)}>
            {EXP_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div className="job-form__field">
          <label>Location</label>
          <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Ikeja, Lagos" />
        </div>
      </div>

      <div className="job-form__row">
        <div className="job-form__field">
          <label>State</label>
          <select value={form.state} onChange={e => update('state', e.target.value)}>
            <option value="">Select</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="job-form__field" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
            <input type="checkbox" checked={form.is_remote} onChange={e => update('is_remote', e.target.checked)} />
            Remote Position
          </label>
        </div>
      </div>

      <h3>Compensation</h3>
      <div className="job-form__row">
        <div className="job-form__field">
          <label>Salary Min</label>
          <input type="number" value={form.salary_min} onChange={e => update('salary_min', e.target.value)} placeholder="e.g. 200000" />
        </div>
        <div className="job-form__field">
          <label>Salary Max</label>
          <input type="number" value={form.salary_max} onChange={e => update('salary_max', e.target.value)} placeholder="e.g. 500000" />
        </div>
      </div>
      <div className="job-form__row">
        <div className="job-form__field">
          <label>Period</label>
          <select value={form.salary_period} onChange={e => update('salary_period', e.target.value)}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="job-form__field" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
            <input type="checkbox" checked={form.hide_salary} onChange={e => update('hide_salary', e.target.checked)} />
            Show as "Competitive"
          </label>
        </div>
      </div>

      <div className="job-form__field">
        <label>Skills</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} list="job-skill-list" placeholder="Type a skill..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
          <Button size="sm" type="button" onClick={addSkill}>Add</Button>
        </div>
        <datalist id="job-skill-list">{skills.map(s => <option key={s.id} value={s.name} />)}</datalist>
        <div className="opportunity-card__badges">
          {form.skills.map(s => <span key={s} className="opportunity-card__badge" style={{ cursor: 'pointer' }} onClick={() => update('skills', form.skills.filter(x => x !== s))}>{s} ✕</span>)}
        </div>
      </div>

      <div className="job-form__field">
        <label>Application Deadline</label>
        <input type="date" value={form.application_deadline} onChange={e => update('application_deadline', e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => handleSave('DRAFT')} disabled={saving}>Save as Draft</Button>
        <Button onClick={() => handleSave('OPEN')} disabled={saving}>{saving ? 'Saving...' : 'Publish'}</Button>
        {isEdit && currentStatus === 'OPEN' && <Button variant="secondary" onClick={() => handleStatusChange('PAUSED')}>Pause</Button>}
        {isEdit && currentStatus === 'PAUSED' && <Button onClick={() => handleStatusChange('OPEN')}>Reopen</Button>}
        {isEdit && currentStatus !== 'CLOSED' && <Button variant="danger" onClick={() => handleStatusChange('CLOSED')}>Close</Button>}
      </div>
    </div>
  );
}
