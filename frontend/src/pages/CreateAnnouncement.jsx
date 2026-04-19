import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminCreateAnnouncement, getStates, getLGAs, getWards } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Card from '../components/Card';
import Button from '../components/Button';

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const [submitting, setSubmitting] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState({
    title: '', body: '', target_scope: 'ALL', priority: 'NORMAL',
    target_state: '', target_lga: '', target_ward: '', is_published: true,
  });

  useEffect(() => { getStates().then(r => setStates(r.data.data || r.data || [])).catch(() => {}); }, []);
  useEffect(() => {
    if (form.target_state) getLGAs(form.target_state).then(r => setLgas(r.data.data || r.data || [])).catch(() => setLgas([]));
    else setLgas([]);
  }, [form.target_state]);
  useEffect(() => {
    if (form.target_lga) getWards(form.target_lga).then(r => setWards(r.data.data || r.data || [])).catch(() => setWards([]));
    else setWards([]);
  }, [form.target_lga]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title || !form.body) { addToast({ type: 'error', message: 'Title and body are required' }); return; }
    setSubmitting(true);
    try {
      await adminCreateAnnouncement(form);
      addToast({ type: 'success', message: 'Announcement created!' });
      navigate(-1);
    } catch (e) {
      addToast({ type: 'error', message: e.response?.data?.message || 'Failed to create' });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back</button>
      <h1>Create Announcement</h1>

      <Card padding="md">
        <div className="mb-4">
          <label className="block font-semibold mb-1">Title *</label>
          <input className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Announcement title" />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Body *</label>
          <textarea className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem] resize-y min-h-[100px]" value={form.body} onChange={e => update('body', e.target.value)} rows={6} placeholder="Announcement content..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="mb-4">
            <label className="block font-semibold mb-1">Target Scope</label>
            <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.target_scope} onChange={e => update('target_scope', e.target.value)}>
              <option value="ALL">All Members</option>
              <option value="STATE">State</option>
              <option value="LGA">LGA</option>
              <option value="WARD">Ward</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Priority</label>
            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              {['NORMAL', 'IMPORTANT', 'URGENT'].map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={e => update('priority', e.target.value)} />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </div>

        {form.target_scope !== 'ALL' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="mb-4">
              <label className="block font-semibold mb-1">State</label>
              <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.target_state} onChange={e => { update('target_state', e.target.value); update('target_lga', ''); update('target_ward', ''); }}>
                <option value="">Select</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {(form.target_scope === 'LGA' || form.target_scope === 'WARD') && (
              <div className="mb-4">
                <label className="block font-semibold mb-1">LGA</label>
                <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.target_lga} onChange={e => { update('target_lga', e.target.value); update('target_ward', ''); }}>
                  <option value="">Select</option>
                  {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
            {form.target_scope === 'WARD' && (
              <div className="mb-4">
                <label className="block font-semibold mb-1">Ward</label>
                <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.target_ward} onChange={e => update('target_ward', e.target.value)}>
                  <option value="">Select</option>
                  {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 'var(--space-lg)' }}>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Creating...' : 'Publish Announcement'}</Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
