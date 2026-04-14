import './NewReport.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardFlow from '../components/CardFlow/CardFlow';
import Button from '../components/Button';
import { createReport, submitReport } from '../api/client';
import { useToastStore } from '../store/toastStore';
import { getFriendlyError } from '../lib/errors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

export default function NewReport() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const handleSubmit = async (formData, isDraft = false) => {
    setLoading(true); setError('');
    try {
      const payload = {
        report_period: formData.report_period || `${currentYear}-${String((formData.selectedMonth ?? currentMonth) + 1).padStart(2, '0')}`,
        report_level: 'WARD',
        summary_of_activities: formData.highlights || '',
        membership_new: formData.membership_new || 0,
        membership_total: formData.membership_total || 0,
        events_held: formData.events_held || 0,
        challenges: formData.challenges || '',
        plans_next_period: formData.plans_next_period || '',
        support_needed: formData.support_needed || '',
        status: 'DRAFT',
      };
      const res = await createReport(payload);
      const reportId = res.data.data?.id || res.data?.id;
      if (!isDraft && reportId) {
        await submitReport(reportId);
      }
      if (!isDraft) {
        setSubmitted(true);
        addToast({ type: 'success', message: 'Report submitted!' });
      } else {
        addToast({ type: 'success', message: 'Draft saved!' });
        navigate('/reports');
      }
    } catch (err) {
      setError(getFriendlyError(err));
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="new-report">
        <div className="new-report__success">
          <div className="new-report__confetti">🎉</div>
          <h2>Report submitted!</h2>
          <p>Your supervisor has been notified.</p>
          <Button onClick={() => navigate('/reports')} size="lg">Back to Reports</Button>
        </div>
      </div>
    );
  }

  const cards = [
    // Card 1 — Period
    ({ data, goNext }) => {
      const [selected, setSelected] = useState(data.selectedMonth ?? currentMonth);
      return (
        <>
          <h2>Which period are you reporting?</h2>
          <p className="subtitle">Select the reporting month</p>
          <div className="month-grid">
            {MONTHS.map((m, i) => (
              <button
                key={i}
                type="button"
                className={`month-btn ${selected === i ? 'selected' : ''}`}
                onClick={() => setSelected(i)}
              >
                {m}
              </button>
            ))}
          </div>
          <Button onClick={() => goNext({ selectedMonth: selected, report_period: `${currentYear}-${String(selected + 1).padStart(2, '0')}` })} size="lg">Next</Button>
        </>
      );
    },
    // Card 2 — Numbers
    ({ data, goNext, goBack }) => {
      const [newMembers, setNewMembers] = useState(data.membership_new || 0);
      const [eventsHeld, setEventsHeld] = useState(data.events_held || 0);
      const [totalActive, setTotalActive] = useState(data.membership_total || 0);
      return (
        <>
          <h2>Your numbers this period</h2>
          <p className="subtitle">Tap +/- or type the values</p>
          <NumberStepper label="New Members Joined" value={newMembers} onChange={setNewMembers} />
          <NumberStepper label="Events You Held" value={eventsHeld} onChange={setEventsHeld} />
          <NumberStepper label="Total Active Members" value={totalActive} onChange={setTotalActive} />
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ membership_new: newMembers, events_held: eventsHeld, membership_total: totalActive })} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
        </>
      );
    },
    // Card 3 — Highlights
    ({ data, goNext, goBack }) => {
      const [text, setText] = useState(data.highlights || '');
      return (
        <>
          <h2>What happened? (the highlights)</h2>
          <p className="subtitle">Aim for at least a paragraph</p>
          <textarea
            className="new-report__textarea"
            placeholder="Tell us what your team did this month. Rallies, outreaches, registrations, wins — anything worth noting."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
          />
          <span style={{ fontSize: '0.8rem', color: text.length >= 50 ? 'var(--color-success)' : 'var(--color-gray-400)', alignSelf: 'flex-end' }}>
            {text.length} chars {text.length < 50 && '(min 50)'}
          </span>
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ highlights: text })} disabled={text.length < 50} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
        </>
      );
    },
    // Card 4 — Challenges
    ({ data, goNext, goBack }) => {
      const [text, setText] = useState(data.challenges || '');
      return (
        <>
          <h2>Any challenges?</h2>
          <textarea
            className="new-report__textarea"
            placeholder="Any obstacles, conflicts, low turnout, resource gaps?"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
          />
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ challenges: text })} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
          <button className="flow-card__skip" onClick={() => goNext({ challenges: '' })}>Skip this</button>
        </>
      );
    },
    // Card 5 — Plans
    ({ data, goNext, goBack }) => {
      const [text, setText] = useState(data.plans_next_period || '');
      return (
        <>
          <h2>Plans for next period?</h2>
          <textarea
            className="new-report__textarea"
            placeholder="What are you working on next month?"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
          />
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ plans_next_period: text })} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
          <button className="flow-card__skip" onClick={() => goNext({ plans_next_period: '' })}>Skip this</button>
        </>
      );
    },
    // Card 6 — Support needed
    ({ data, goNext, goBack }) => {
      const [text, setText] = useState(data.support_needed || '');
      return (
        <>
          <h2>Need anything from National?</h2>
          <textarea
            className="new-report__textarea"
            placeholder="Resources, support, clarification, funds?"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
          />
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ support_needed: text })} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
          <button className="flow-card__skip" onClick={() => goNext({ support_needed: '' })}>Skip this</button>
        </>
      );
    },
    // Card 7 — Review
    ({ data, goBack, goTo }) => (
      <>
        <h2>Review & Submit</h2>
        <div>
          <div className="flow-card__review-section">
            <div>
              <div className="flow-card__review-label">Period</div>
              <div className="flow-card__review-value">{MONTHS[data.selectedMonth]} {currentYear}</div>
            </div>
            <button className="flow-card__review-edit" onClick={() => goTo(0)}>Edit</button>
          </div>
          <div className="flow-card__review-section">
            <div>
              <div className="flow-card__review-label">Numbers</div>
              <div className="flow-card__review-value">{data.membership_new} new members · {data.events_held} events · {data.membership_total} active</div>
            </div>
            <button className="flow-card__review-edit" onClick={() => goTo(1)}>Edit</button>
          </div>
          <div className="flow-card__review-section">
            <div>
              <div className="flow-card__review-label">Highlights</div>
              <div className="flow-card__review-value" style={{ maxWidth: 360 }}>{data.highlights ? data.highlights.slice(0, 120) + (data.highlights.length > 120 ? '...' : '') : '—'}</div>
            </div>
            <button className="flow-card__review-edit" onClick={() => goTo(2)}>Edit</button>
          </div>
          {data.challenges && (
            <div className="flow-card__review-section">
              <div>
                <div className="flow-card__review-label">Challenges</div>
                <div className="flow-card__review-value">{data.challenges.slice(0, 80)}...</div>
              </div>
              <button className="flow-card__review-edit" onClick={() => goTo(3)}>Edit</button>
            </div>
          )}
        </div>
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
        <div className="flow-card__nav">
          <button className="flow-card__back" onClick={goBack}>← Back</button>
          <Button variant="secondary" onClick={() => handleSubmit(data, true)} loading={loading}>Save Draft</Button>
          <Button onClick={() => handleSubmit(data)} loading={loading} size="lg" style={{ flex: 1 }}>Submit Report</Button>
        </div>
      </>
    ),
  ];

  return (
    <div className="new-report">
      <button className="new-report__back" onClick={() => navigate('/reports')}>← Back</button>
      <h1>New Grassroots Report</h1>
      <CardFlow cards={cards} />
    </div>
  );
}
