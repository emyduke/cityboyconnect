import './CreateEvent.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardFlow from '../components/CardFlow/CardFlow';
import Input from '../components/Input';
import Button from '../components/Button';
import SearchableSelect from '../components/SearchableSelect';
import FileUpload from '../components/FileUpload';
import { createEvent, getStates, getLGAs, getWards } from '../api/client';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { getFriendlyError } from '../lib/errors';

const EVENT_TYPES = [
  { value: 'RALLY', label: 'Rally', icon: '🏟' },
  { value: 'TOWN_HALL', label: 'Town Hall', icon: '🏛' },
  { value: 'TRAINING', label: 'Training', icon: '📚' },
  { value: 'MEETING', label: 'Meeting', icon: '🤝' },
  { value: 'OUTREACH', label: 'Outreach', icon: '🌿' },
  { value: 'OTHER', label: 'Other', icon: '✦' },
];

const VISIBILITY_OPTIONS = [
  { value: 'ALL', label: 'All Members' },
  { value: 'STATE', label: 'My State' },
  { value: 'LGA', label: 'My LGA' },
  { value: 'WARD', label: 'My Ward' },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const user = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    getStates().then(res => setStates((res.data.data || res.data.results || res.data).map(s => ({ value: s.id, label: s.name })))).catch(() => {});
  }, []);

  const handleStateChange = async (val, setLocalLgas) => {
    if (!val) return;
    try {
      const res = await getLGAs(val);
      const list = (res.data.data || res.data.results || res.data).map(l => ({ value: l.id, label: l.name }));
      setLgas(list);
      if (setLocalLgas) setLocalLgas(list);
    } catch { /* ok */ }
  };

  const handleLgaChange = async (val, setLocalWards) => {
    if (!val) return;
    try {
      const res = await getWards(val);
      const list = (res.data.data || res.data.results || res.data).map(w => ({ value: w.id, label: w.name }));
      setWards(list);
      if (setLocalWards) setLocalWards(list);
    } catch { /* ok */ }
  };

  const handleSubmit = async (formData, isDraft = false) => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (isDraft) fd.append('status', 'DRAFT');
      if (banner) fd.append('banner_image', banner);
      await createEvent(fd);
      addToast({ type: 'success', message: isDraft ? 'Draft saved!' : 'Event created!' });
      navigate('/events');
    } catch (err) {
      setError(getFriendlyError(err));
      setLoading(false);
    }
  };

  const cards = [
    // Card 1 — Event Type
    ({ data, goNext }) => (
      <>
        <h2>What kind of event?</h2>
        <p className="subtitle">Pick the type that best describes your event</p>
        <div className="event-type-grid">
          {EVENT_TYPES.map(t => (
            <div
              key={t.value}
              className={`event-type-card ${data.event_type === t.value ? 'selected' : ''}`}
              onClick={() => goNext({ event_type: t.value })}
            >
              <span className="icon">{t.icon}</span>
              <span className="label">{t.label}</span>
            </div>
          ))}
        </div>
      </>
    ),
    // Card 2 — Name
    ({ data, goNext, goBack }) => {
      const [title, setTitle] = useState(data.title || '');
      return (
        <>
          <h2>Give it a name <span style={{ color: 'var(--color-danger)' }}>*</span></h2>
          <p className="subtitle">Make it clear so members know what to expect</p>
          <Input
            placeholder="e.g. Ward 5 Voter Registration Drive"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', alignSelf: 'flex-end' }}>{title.length}/100</span>
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ title })} disabled={!title.trim()} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
        </>
      );
    },
    // Card 3 — Description (optional)
    ({ data, goNext, goBack }) => {
      const [desc, setDesc] = useState(data.description || '');
      return (
        <>
          <h2>Description <span style={{ fontSize: '0.78rem', color: 'var(--color-gray-400)', fontWeight: 400, marginLeft: '4px' }}>(optional)</span></h2>
          <p className="subtitle">Tell members what this event is about</p>
          <textarea
            className="create-event__textarea"
            placeholder="Tell members what this event is about..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={5}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ description: desc })} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
          <button className="flow-card__skip" onClick={() => goNext({ description: '' })}>Skip for now</button>
        </>
      );
    },
    // Card 3 — When
    ({ data, goNext, goBack }) => {
      const [start, setStart] = useState(data.start_datetime || '');
      const [end, setEnd] = useState(data.end_datetime || '');
      return (
        <>
          <h2>When is it happening?</h2>
          <Input label="Starts" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
          <Input label="Ends (optional)" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ start_datetime: start, end_datetime: end })} disabled={!start} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
        </>
      );
    },
    // Card 4 — Where
    ({ data, goNext, goBack }) => {
      const [venue, setVenue] = useState(data.venue_name || '');
      const [address, setAddress] = useState(data.venue_address || '');
      const [st, setSt] = useState(data.state || user?.state_id || '');
      const [lg, setLg] = useState(data.lga || '');
      const [wd, setWd] = useState(data.ward || '');

      useEffect(() => {
        if (st) handleStateChange(st);
      }, []);

      return (
        <>
          <h2>Where?</h2>
          <Input placeholder="Venue name, e.g. Ajegunle Town Hall" value={venue} onChange={e => setVenue(e.target.value)} />
          <SearchableSelect label="State" options={states} value={st} onChange={v => { setSt(v); setLg(''); setWd(''); handleStateChange(v); }} />
          <SearchableSelect label="LGA" options={lgas} value={lg} onChange={v => { setLg(v); setWd(''); handleLgaChange(v); }} disabled={!st} />
          <Input label="Full address (optional)" placeholder="Full address — helps members find it" value={address} onChange={e => setAddress(e.target.value)} />
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ venue_name: venue, venue_address: address, state: st, lga: lg, ward: wd })} disabled={!venue.trim()} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
        </>
      );
    },
    // Card 5 — Visibility
    ({ data, goNext, goBack }) => {
      const [vis, setVis] = useState(data.visibility || 'ALL');
      return (
        <>
          <h2>Who should see this?</h2>
          <div className="event-type-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {VISIBILITY_OPTIONS.map(v => (
              <div key={v.value} className={`event-type-card ${vis === v.value ? 'selected' : ''}`} onClick={() => setVis(v.value)}>
                <span className="label">{v.label}</span>
              </div>
            ))}
          </div>
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button onClick={() => goNext({ visibility: vis })} size="lg" style={{ flex: 1 }}>Next</Button>
          </div>
        </>
      );
    },
    // Card 6 — Banner
    ({ data, goNext, goBack }) => (
      <>
        <h2>Add a banner (optional)</h2>
        <FileUpload label="Upload event banner" accept="image/*" onChange={setBanner} />
        <div className="flow-card__nav">
          <button className="flow-card__back" onClick={goBack}>← Back</button>
          <Button onClick={() => goNext({})} size="lg" style={{ flex: 1 }}>Next</Button>
        </div>
        <button className="flow-card__skip" onClick={() => goNext({})}>Skip for now</button>
      </>
    ),
    // Card 8 — Review
    ({ data, goBack, goTo }) => {
      const typeLabel = EVENT_TYPES.find(t => t.value === data.event_type)?.label || data.event_type;
      const visLabel = VISIBILITY_OPTIONS.find(v => v.value === data.visibility)?.label || data.visibility;
      return (
        <>
          <h2>Review & Publish</h2>
          <div>
            <div className="flow-card__review-section">
              <div>
                <div className="flow-card__review-label">Event Type</div>
                <div className="flow-card__review-value">{typeLabel}</div>
              </div>
              <button className="flow-card__review-edit" onClick={() => goTo(0)}>Edit</button>
            </div>
            <div className="flow-card__review-section">
              <div>
                <div className="flow-card__review-label">Name</div>
                <div className="flow-card__review-value">{data.title}</div>
              </div>
              <button className="flow-card__review-edit" onClick={() => goTo(1)}>Edit</button>
            </div>
            {data.description && (
              <div className="flow-card__review-section">
                <div>
                  <div className="flow-card__review-label">Description</div>
                  <div className="flow-card__review-value">{data.description}</div>
                </div>
                <button className="flow-card__review-edit" onClick={() => goTo(2)}>Edit</button>
              </div>
            )}
            <div className="flow-card__review-section">
              <div>
                <div className="flow-card__review-label">When</div>
                <div className="flow-card__review-value">{data.start_datetime ? new Date(data.start_datetime).toLocaleString() : '—'}</div>
              </div>
              <button className="flow-card__review-edit" onClick={() => goTo(3)}>Edit</button>
            </div>
            <div className="flow-card__review-section">
              <div>
                <div className="flow-card__review-label">Where</div>
                <div className="flow-card__review-value">{data.venue_name}</div>
              </div>
              <button className="flow-card__review-edit" onClick={() => goTo(4)}>Edit</button>
            </div>
            <div className="flow-card__review-section">
              <div>
                <div className="flow-card__review-label">Visibility</div>
                <div className="flow-card__review-value">{visLabel}</div>
              </div>
              <button className="flow-card__review-edit" onClick={() => goTo(5)}>Edit</button>
            </div>
          </div>
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}
          <div className="flow-card__nav">
            <button className="flow-card__back" onClick={goBack}>← Back</button>
            <Button variant="secondary" onClick={() => handleSubmit(data, true)} loading={loading} size="lg">Save Draft</Button>
            <Button onClick={() => handleSubmit(data)} loading={loading} size="lg" style={{ flex: 1 }}>Publish Event</Button>
          </div>
        </>
      );
    },
  ];

  return (
    <div className="create-event">
      <button className="create-event__back" onClick={() => navigate('/events')}>← Back to Events</button>
      <h1>Create Event</h1>
      <CardFlow cards={cards} />
    </div>
  );
}
