import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReport, updateReport, submitReport } from '../api/client';
import Button from '../components/Button';
import { useToastStore } from '../store/toastStore';
import { getFriendlyError } from '../lib/errors';

function NumberStepper({ label, value, onChange, min = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-700)' }}>{label}</span>
      <div className="number-stepper">
        <button type="button" className="stepper-btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
        <span className="stepper-value">{value}</span>
        <button type="button" className="stepper-btn" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [summary, setSummary] = useState('');
  const [membershipNew, setMembershipNew] = useState(0);
  const [membershipTotal, setMembershipTotal] = useState(0);
  const [eventsHeld, setEventsHeld] = useState(0);
  const [challenges, setChallenges] = useState('');
  const [plans, setPlans] = useState('');
  const [support, setSupport] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getReport(id);
        const r = res.data.data || res.data;
        setReport(r);
        setSummary(r.summary_of_activities || '');
        setMembershipNew(r.membership_new || 0);
        setMembershipTotal(r.membership_total || 0);
        setEventsHeld(r.events_held || 0);
        setChallenges(r.challenges || '');
        setPlans(r.plans_next_period || '');
        setSupport(r.support_needed || '');
      } catch (err) {
        addToast({ type: 'error', message: getFriendlyError(err) });
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReport(id, {
        summary_of_activities: summary,
        membership_new: membershipNew,
        membership_total: membershipTotal,
        events_held: eventsHeld,
        challenges,
        plans_next_period: plans,
        support_needed: support,
      });
      addToast({ type: 'success', message: 'Draft saved.' });
    } catch (err) {
      addToast({ type: 'error', message: getFriendlyError(err) });
    }
    setSaving(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Save first, then submit
      await updateReport(id, {
        summary_of_activities: summary,
        membership_new: membershipNew,
        membership_total: membershipTotal,
        events_held: eventsHeld,
        challenges,
        plans_next_period: plans,
        support_needed: support,
      });
      await submitReport(id);
      addToast({ type: 'success', message: 'Report submitted successfully!' });
      navigate('/reports');
    } catch (err) {
      const apiError = err?.response?.data?.error;
      addToast({ type: 'error', message: apiError?.message || getFriendlyError(err) });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6" style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--color-gray-400)' }}>Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col gap-6">
        <button className="bg-transparent border-none text-forest text-[0.9rem] cursor-pointer font-medium self-start hover:underline" onClick={() => navigate('/reports')}>← Back</button>
        <p>Report not found.</p>
      </div>
    );
  }

  const isDraft = report.status === 'DRAFT';

  return (
    <div className="flex flex-col gap-6">
      <button className="bg-transparent border-none text-forest text-[0.9rem] cursor-pointer font-medium self-start hover:underline" onClick={() => navigate('/reports')}>← Back to Reports</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>{isDraft ? 'Edit Report' : 'View Report'}</h1>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          background: isDraft ? 'var(--color-gray-100)' : 'var(--color-forest-light, #e8f5e9)',
          color: isDraft ? 'var(--color-gray-600)' : 'var(--color-forest)',
        }}>{report.status}</span>
      </div>

      {!isDraft && (
        <div style={{
          background: 'var(--color-gray-50)', border: '1px solid var(--color-border)',
          borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span>📋</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>This report has been submitted</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
              Submitted reports cannot be edited. Status: <strong>{report.status}</strong>
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: '0.25rem' }}>
            Period: <span style={{ fontWeight: 400 }}>{report.report_period}</span>
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', margin: 0 }}>
            {report.report_level} Report
          </p>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-700)', display: 'block', marginBottom: '0.5rem' }}>
            Summary of activities <span style={{ color: 'var(--color-danger)' }}>*</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', fontWeight: 400, marginLeft: '4px' }}>Required before submitting</span>
          </label>
          <textarea
            className="w-full min-h-[120px] border border-gray-200 rounded-lg p-4 font-body text-[0.95rem] resize-y transition-colors focus:outline-none focus:border-forest"
            placeholder="What did your team do this period?"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={5}
            disabled={!isDraft}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <NumberStepper label="New members" value={membershipNew} onChange={isDraft ? setMembershipNew : () => {}} />
          <NumberStepper label="Total members" value={membershipTotal} onChange={isDraft ? setMembershipTotal : () => {}} />
          <NumberStepper label="Events held" value={eventsHeld} onChange={isDraft ? setEventsHeld : () => {}} />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-700)', display: 'block', marginBottom: '0.5rem' }}>
            Challenges <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea className="w-full min-h-[120px] border border-gray-200 rounded-lg p-4 font-body text-[0.95rem] resize-y transition-colors focus:outline-none focus:border-forest" placeholder="Any obstacles?" value={challenges} onChange={e => setChallenges(e.target.value)} rows={3} disabled={!isDraft} />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-700)', display: 'block', marginBottom: '0.5rem' }}>
            Plans for next period <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea className="w-full min-h-[120px] border border-gray-200 rounded-lg p-4 font-body text-[0.95rem] resize-y transition-colors focus:outline-none focus:border-forest" placeholder="What are you planning?" value={plans} onChange={e => setPlans(e.target.value)} rows={3} disabled={!isDraft} />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-700)', display: 'block', marginBottom: '0.5rem' }}>
            Support needed <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea className="w-full min-h-[120px] border border-gray-200 rounded-lg p-4 font-body text-[0.95rem] resize-y transition-colors focus:outline-none focus:border-forest" placeholder="Resources, guidance, or clarification?" value={support} onChange={e => setSupport(e.target.value)} rows={3} disabled={!isDraft} />
        </div>

        {isDraft && (
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <Button variant="secondary" onClick={handleSave} loading={saving} size="lg">Save Draft</Button>
            <Button onClick={handleSubmit} loading={submitting} size="lg" style={{ flex: 1 }}>Submit Report</Button>
          </div>
        )}
      </div>
    </div>
  );
}
