import { cn } from '../lib/cn';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderAddMember, leaderBulkAddMembers, getStates, getLGAs, getWards } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Card from '../components/Card';
import Button from '../components/Button';

export default function AddMember() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const [tab, setTab] = useState('single');
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Single form
  const [form, setForm] = useState({
    phone_number: '', full_name: '', gender: '', date_of_birth: '',
    occupation: '', state_id: '', lga_id: '', ward_id: '', address: '',
  });

  // Bulk
  const [bulkMembers, setBulkMembers] = useState([{ phone_number: '', full_name: '', ward_id: '' }]);
  const [bulkResults, setBulkResults] = useState(null);

  useEffect(() => {
    getStates().then(r => setStates(r.data.data || r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.state_id) getLGAs(form.state_id).then(r => setLgas(r.data.data || r.data || [])).catch(() => setLgas([]));
    else setLgas([]);
  }, [form.state_id]);

  useEffect(() => {
    if (form.lga_id) getWards(form.lga_id).then(r => setWards(r.data.data || r.data || [])).catch(() => setWards([]));
    else setWards([]);
  }, [form.lga_id]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSingle = async () => {
    if (!form.phone_number || !form.full_name || !form.state_id || !form.lga_id || !form.ward_id) {
      addToast({ type: 'error', message: 'Phone, Name, State, LGA, and Ward are required' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await leaderAddMember(form);
      const data = res.data.data || res.data;
      addToast({ type: 'success', message: `Member added! ID: ${data.membership_id || 'N/A'}` });
      setForm({ phone_number: '', full_name: '', gender: '', date_of_birth: '', occupation: '', state_id: form.state_id, lga_id: form.lga_id, ward_id: form.ward_id, address: '' });
    } catch (e) {
      addToast({ type: 'error', message: e.response?.data?.message || 'Failed to add member' });
    }
    setSubmitting(false);
  };

  const handleBulk = async () => {
    const valid = bulkMembers.filter(m => m.phone_number && m.full_name);
    if (valid.length === 0) { addToast({ type: 'error', message: 'Add at least one member with phone and name' }); return; }
    setSubmitting(true);
    try {
      const payload = valid.map(m => ({
        ...m,
        state_id: form.state_id || m.state_id,
        lga_id: form.lga_id || m.lga_id,
        ward_id: m.ward_id || form.ward_id,
      }));
      const res = await leaderBulkAddMembers({ members: payload });
      setBulkResults(res.data.data || res.data);
      addToast({ type: 'success', message: `${res.data.data?.successful || res.data.successful || 0} member(s) added` });
    } catch (e) {
      addToast({ type: 'error', message: e.response?.data?.message || 'Failed' });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Add Member</h1>
      <Card padding="md" style={{ marginBottom: 'var(--space-md)', background: '#ecfdf5' }}>
        <p style={{ margin: 0, color: '#065f46' }}>Members you add will be linked to your referral network and can complete their verification by logging in with their phone number.</p>
      </Card>

      <div className="flex gap-1 mb-6 border-b-2 border-gray-200 overflow-x-auto">
        <button className={cn("py-2 px-4 bg-transparent border-0 cursor-pointer font-semibold text-gray-500 border-b-2 border-b-transparent -mb-0.5 whitespace-nowrap transition-colors", tab === 'single' && "text-forest border-b-forest")} onClick={() => setTab('single')}>Single Add</button>
        <button className={cn("py-2 px-4 bg-transparent border-0 cursor-pointer font-semibold text-gray-500 border-b-2 border-b-transparent -mb-0.5 whitespace-nowrap transition-colors", tab === 'bulk' && "text-forest border-b-forest")} onClick={() => setTab('bulk')}>Bulk Add</button>
      </div>

      {tab === 'single' ? (
        <Card padding="md">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="mb-4">
              <label className="block font-semibold mb-1">Phone Number *</label>
              <input className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.phone_number} onChange={e => update('phone_number', e.target.value)} placeholder="+234..." />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Full Name *</label>
              <input className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="John Doe" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="mb-4">
              <label className="block font-semibold mb-1">Gender</label>
              <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.gender} onChange={e => update('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Date of Birth</label>
              <input className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Occupation</label>
            <input className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.occupation} onChange={e => update('occupation', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="mb-4">
              <label className="block font-semibold mb-1">State *</label>
              <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.state_id} onChange={e => { update('state_id', e.target.value); update('lga_id', ''); update('ward_id', ''); }}>
                <option value="">Select</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">LGA *</label>
              <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.lga_id} onChange={e => { update('lga_id', e.target.value); update('ward_id', ''); }}>
                <option value="">Select</option>
                {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Ward *</label>
            <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.ward_id} onChange={e => update('ward_id', e.target.value)}>
              <option value="">Select</option>
              {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Address</label>
            <textarea className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem] resize-y min-h-25" value={form.address} onChange={e => update('address', e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSingle} disabled={submitting}>{submitting ? 'Adding...' : 'Add Member'}</Button>
        </Card>
      ) : (
        <Card padding="md">
          <div className="grid grid-cols-2 gap-4 mb-4" style={{ marginBottom: 'var(--space-sm)' }}>
            <div className="mb-4">
              <label className="block font-semibold mb-1">State *</label>
              <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.state_id} onChange={e => { update('state_id', e.target.value); update('lga_id', ''); }}>
                <option value="">Select</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">LGA *</label>
              <select className="w-full py-2 px-4 border border-gray-200 rounded-lg text-[0.95rem]" value={form.lga_id} onChange={e => update('lga_id', e.target.value)}>
                <option value="">Select</option>
                {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          {bulkMembers.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                {i === 0 && <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Phone</label>}
                <input value={m.phone_number} onChange={e => { const arr = [...bulkMembers]; arr[i] = { ...arr[i], phone_number: e.target.value }; setBulkMembers(arr); }} placeholder="+234..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                {i === 0 && <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Name</label>}
                <input value={m.full_name} onChange={e => { const arr = [...bulkMembers]; arr[i] = { ...arr[i], full_name: e.target.value }; setBulkMembers(arr); }} placeholder="Full Name" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                {i === 0 && <label style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: '0.85rem' }}>Ward</label>}
                <select value={m.ward_id} onChange={e => { const arr = [...bulkMembers]; arr[i] = { ...arr[i], ward_id: e.target.value }; setBulkMembers(arr); }} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <option value="">Select</option>
                  {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              {bulkMembers.length > 1 && (
                <button onClick={() => setBulkMembers(bulkMembers.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 8 }}>✕</button>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-md)' }}>
            {bulkMembers.length < 20 && (
              <Button size="sm" variant="secondary" onClick={() => setBulkMembers([...bulkMembers, { phone_number: '', full_name: '', ward_id: '' }])}>+ Add Row</Button>
            )}
            <Button onClick={handleBulk} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit All'}</Button>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 8 }}>{bulkMembers.length}/20 rows</p>

          {bulkResults && (
            <Card padding="md" style={{ marginTop: 'var(--space-md)', background: '#f9fafb' }}>
              <h3>Results: {bulkResults.successful || 0} added, {bulkResults.failed || 0} failed</h3>
              {(bulkResults.results || []).map((r, i) => (
                <p key={i} style={{ fontSize: '0.85rem', color: r.status === 'created' ? '#065f46' : '#991b1b' }}>
                  {r.phone_number}: {r.status === 'created' ? `✅ ${r.membership_id}` : `❌ ${r.reason}`}
                </p>
              ))}
            </Card>
          )}
        </Card>
      )}
    </div>
  );
}
