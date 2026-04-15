import './CreateEvent.css';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import SearchableSelect from '../components/SearchableSelect';
import FileUpload from '../components/FileUpload';
import Skeleton from '../components/Skeleton';
import { getEvent, updateEvent, getStates, getLGAs } from '../api/client';
import { useToastStore } from '../store/toastStore';
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

function formatDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [banner, setBanner] = useState(null);

  const [form, setForm] = useState({
    event_type: '',
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    venue_name: '',
    venue_address: '',
    state: '',
    lga: '',
    visibility: 'ALL',
    status: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    const load = async () => {
      try {
        const [eventRes, statesRes] = await Promise.all([getEvent(id), getStates()]);
        const ev = eventRes.data.data || eventRes.data;
        const stList = (statesRes.data.data || statesRes.data.results || statesRes.data).map(s => ({ value: s.id, label: s.name }));
        setStates(stList);

        const stateId = ev.state?.id || ev.state || '';
        const lgaId = ev.lga?.id || ev.lga || '';

        setForm({
          event_type: ev.event_type || '',
          title: ev.title || '',
          description: ev.description || '',
          start_datetime: formatDatetimeLocal(ev.start_datetime),
          end_datetime: formatDatetimeLocal(ev.end_datetime),
          venue_name: ev.venue_name || '',
          venue_address: ev.venue_address || '',
          state: stateId,
          lga: lgaId,
          visibility: ev.visibility || 'ALL',
          status: ev.status || '',
        });

        if (stateId) {
          const lgRes = await getLGAs(stateId);
          setLgas((lgRes.data.data || lgRes.data.results || lgRes.data).map(l => ({ value: l.id, label: l.name })));
        }
      } catch (err) {
        setError(getFriendlyError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStateChange = async (val) => {
    set('state', val);
    set('lga', '');
    if (!val) { setLgas([]); return; }
    try {
      const res = await getLGAs(val);
      setLgas((res.data.data || res.data.results || res.data).map(l => ({ value: l.id, label: l.name })));
    } catch { /* ok */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_datetime || !form.venue_name.trim()) {
      setError('Title, start date, and venue are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (banner) fd.append('banner_image', banner);
      await updateEvent(id, fd);
      addToast({ type: 'success', message: 'Event updated!' });
      navigate(`/events/${id}`);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-event">
        <Skeleton variant="text" style={{ width: '60%', height: '2rem', marginBottom: '1rem' }} />
        <Skeleton variant="card" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="create-event">
      <button className="create-event__back" onClick={() => navigate(`/events/${id}`)}>← Back to Event</button>
      <h1>Edit Event</h1>

      <form className="edit-event-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Event Type */}
        <label className="flow-card__review-label">Event Type</label>
        <div className="event-type-grid">
          {EVENT_TYPES.map(t => (
            <div
              key={t.value}
              className={`event-type-card ${form.event_type === t.value ? 'selected' : ''}`}
              onClick={() => set('event_type', t.value)}
            >
              <span className="icon">{t.icon}</span>
              <span className="label">{t.label}</span>
            </div>
          ))}
        </div>

        {/* Title */}
        <Input
          label="Event Name"
          placeholder="e.g. Ward 5 Voter Registration Drive"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          maxLength={100}
          required
        />

        {/* Description */}
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', display: 'block' }}>Description</label>
          <textarea
            className="create-event__textarea"
            placeholder="Tell members what this event is about..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        {/* Date / Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Starts" type="datetime-local" value={form.start_datetime} onChange={e => set('start_datetime', e.target.value)} required />
          <Input label="Ends (optional)" type="datetime-local" value={form.end_datetime} onChange={e => set('end_datetime', e.target.value)} />
        </div>

        {/* Location */}
        <Input label="Venue Name" placeholder="e.g. Ajegunle Town Hall" value={form.venue_name} onChange={e => set('venue_name', e.target.value)} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <SearchableSelect label="State" options={states} value={form.state} onChange={handleStateChange} />
          <SearchableSelect label="LGA" options={lgas} value={form.lga} onChange={v => set('lga', v)} disabled={!form.state} />
        </div>
        <Input label="Full Address (optional)" placeholder="Full address" value={form.venue_address} onChange={e => set('venue_address', e.target.value)} />

        {/* Visibility */}
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Visibility</label>
          <div className="event-type-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {VISIBILITY_OPTIONS.map(v => (
              <div key={v.value} className={`event-type-card ${form.visibility === v.value ? 'selected' : ''}`} onClick={() => set('visibility', v.value)}>
                <span className="label">{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Banner */}
        <FileUpload label="Replace banner image (optional)" accept="image/*" onChange={setBanner} />

        {/* Status */}
        {form.status && (
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Status</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['DRAFT', 'PUBLISHED', 'CANCELLED'].map(s => (
                <button
                  type="button"
                  key={s}
                  className={`event-type-card ${form.status === s ? 'selected' : ''}`}
                  onClick={() => set('status', s)}
                  style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="secondary" type="button" onClick={() => navigate(`/events/${id}`)}>Cancel</Button>
          <Button type="submit" loading={saving} style={{ flex: 1 }}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
