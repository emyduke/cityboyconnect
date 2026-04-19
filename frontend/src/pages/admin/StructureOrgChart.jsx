import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { getStates, getLGAs, getWards } from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';

const POSITIONS = [
  { value: 'STATE_DIRECTOR', label: 'State Director' },
  { value: 'DEPUTY_STATE_DIRECTOR', label: 'Deputy State Director' },
  { value: 'STATE_COORDINATOR', label: 'State Coordinator' },
  { value: 'STATE_SECRETARY', label: 'State Secretary' },
  { value: 'LGA_COORDINATOR', label: 'LGA Coordinator' },
  { value: 'WARD_COORDINATOR', label: 'Ward Coordinator' },
  { value: 'UNIT_LEADER', label: 'Unit Leader' },
];

export default function StructureOrgChart() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [orgChart, setOrgChart] = useState(null);
  const [leadership, setLeadership] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appointModal, setAppointModal] = useState(false);
  const [appointForm, setAppointForm] = useState({ user_id: '', position: '', state_id: '', lga_id: '', ward_id: '' });
  const [appointLoading, setAppointLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberOptions, setMemberOptions] = useState([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [formStates, setFormStates] = useState([]);
  const [formLGAs, setFormLGAs] = useState([]);
  const [formWards, setFormWards] = useState([]);
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    adminApi.getStates().then(res => {
      const raw = res.data || res;
      const list = Array.isArray(raw) ? raw : (raw.results || raw.data || []);
      const opts = list.map(s => ({ value: s.id, label: s.name }));
      setStates(opts);
      setFormStates(opts);
    }).catch(() => { addToast({ type: 'error', message: 'Failed to load states' }); });
  }, []);

  // Search members for appointment (debounced)
  useEffect(() => {
    if (memberSearch.length < 2) { setMemberOptions([]); return; }
    const timer = setTimeout(async () => {
      setMemberSearchLoading(true);
      try {
        const res = await adminApi.getMembers({ search: memberSearch, page_size: 15 });
        const data = res.data || res;
        setMemberOptions((data.results || data || []).map(m => ({
          value: m.id,
          label: `${m.full_name || '—'} (${m.state_name || '—'})`,
        })));
      } catch { setMemberOptions([]); }
      setMemberSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  // Load LGAs when form state changes
  useEffect(() => {
    if (!appointForm.state_id) { setFormLGAs([]); setFormWards([]); return; }
    getLGAs(appointForm.state_id).then(res => {
      const raw = res.data?.data || res.data || res;
      const list = Array.isArray(raw) ? raw : (raw.results || raw.data || []);
      setFormLGAs(list.map(l => ({ value: l.id, label: l.name })));
    }).catch(() => setFormLGAs([]));
    setAppointForm(f => ({ ...f, lga_id: '', ward_id: '' }));
    setFormWards([]);
  }, [appointForm.state_id]);

  // Load Wards when form LGA changes
  useEffect(() => {
    if (!appointForm.lga_id) { setFormWards([]); return; }
    getWards(appointForm.lga_id).then(res => {
      const raw = res.data?.data || res.data || res;
      const list = Array.isArray(raw) ? raw : (raw.results || raw.data || []);
      setFormWards(list.map(w => ({ value: w.id, label: w.name })));
    }).catch(() => setFormWards([]));
    setAppointForm(f => ({ ...f, ward_id: '' }));
  }, [appointForm.lga_id]);

  const loadState = async (stateId) => {
    if (!stateId) return;
    setLoading(true);
    try {
      const [orgRes, leaderRes] = await Promise.all([
        adminApi.getStateOrgChart(stateId),
        adminApi.getLeadership({ state_id: stateId }),
      ]);
      setOrgChart(orgRes.data || orgRes);
      setLeadership((leaderRes.data || leaderRes)?.results || leaderRes.data || []);
    } catch { addToast({ type: 'error', message: 'Failed to load structure' }); }
    setLoading(false);
  };

  const handleStateChange = (val) => {
    setSelectedState(val);
    loadState(val);
  };

  const handleAppoint = async (e) => {
    e.preventDefault();
    setAppointLoading(true);
    try {
      const payload = { user_id: appointForm.user_id, position: appointForm.position };
      if (appointForm.state_id) payload.state_id = appointForm.state_id;
      if (appointForm.lga_id) payload.lga_id = appointForm.lga_id;
      if (appointForm.ward_id) payload.ward_id = appointForm.ward_id;
      await adminApi.appointLeader(payload);
      addToast({ type: 'success', message: 'Leader appointed successfully' });
      setAppointModal(false);
      setAppointForm({ user_id: '', position: '', state_id: '', lga_id: '', ward_id: '' });
      setMemberSearch('');
      setMemberOptions([]);
      if (selectedState) loadState(selectedState);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Appointment failed';
      addToast({ type: 'error', message: msg });
    }
    setAppointLoading(false);
  };

  const handleRemove = async (pk) => {
    if (!window.confirm('Remove this leader from their position?')) return;
    try {
      await adminApi.removeLeader(pk);
      addToast({ type: 'success', message: 'Leader removed' });
      if (selectedState) loadState(selectedState);
    } catch { addToast({ type: 'error', message: 'Removal failed' }); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">Structure & Leaders</h1>
        <Button size="sm" onClick={() => setAppointModal(true)}>+ Appoint Leader</Button>
      </div>
      <div className="mb-6 max-w-[400px]">
        <SearchableSelect label="Select State" options={states} value={selectedState} onChange={handleStateChange} placeholder="Choose a state to view" />
      </div>

      {loading && (
        <div className="grid grid-cols-4 max-md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
      )}

      {!loading && orgChart && (
        <div>
          {leadership.length > 0 ? (
            <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4 mb-6">
              {leadership.map((leader, i) => (
                <Card key={i} padding="md">
                  <div className="flex items-center gap-3">
                    <Avatar name={leader.member_name || '—'} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{leader.member_name || 'Vacant'}</div>
                      <div className="text-xs text-forest font-semibold">{leader.position_title || leader.position || leader.role}</div>
                      <div className="text-xs text-gray-400">{leader.level_name || leader.scope || ''}</div>
                    </div>
                    <button className="bg-transparent border-none text-gray-400 cursor-pointer text-sm hover:text-danger" onClick={() => handleRemove(leader.id || leader.pk)} title="Remove">✕</button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <span className="text-4xl">🏛</span>
              <p className="text-sm">No leaders assigned for this state</p>
              <p className="text-xs text-gray-300">Use "Appoint Leader" to assign positions</p>
            </div>
          )}

          {orgChart.lgas && orgChart.lgas.length > 0 && (
            <>
              <h3 className="text-base font-bold mb-3 mt-6">LGAs ({orgChart.lgas.length})</h3>
              <div className="grid grid-cols-4 max-md:grid-cols-2 gap-3">
                {orgChart.lgas.map((lga, i) => (
                  <Card key={i} padding="sm">
                    <div className="font-semibold text-sm">{lga.name}</div>
                    <div className="text-xs text-gray-400">{lga.member_count || 0} members</div>
                    {lga.leader_name && <div className="text-xs text-forest mt-1">👤 {lga.leader_name}</div>}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !orgChart && selectedState && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Could not load structure data</p>
        </div>
      )}

      {!selectedState && !loading && (
        <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
          <span className="text-4xl">🗺️</span>
          <p className="text-sm">Select a state to view its structure</p>
        </div>
      )}

      {appointModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setAppointModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-[480px] shadow-elevated max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Appoint Leader</h3>
            <p className="text-xs text-gray-500 mb-4">Select a member and assign a leadership position</p>
            <form onSubmit={handleAppoint} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Member</label>
                <SearchableSelect
                  options={memberOptions}
                  value={appointForm.user_id}
                  onChange={val => setAppointForm(f => ({ ...f, user_id: val }))}
                  placeholder={memberSearchLoading ? 'Searching...' : 'Type member name to search...'}
                  onSearchChange={setMemberSearch}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Position</label>
                <SearchableSelect
                  options={POSITIONS}
                  value={appointForm.position}
                  onChange={val => setAppointForm(f => ({ ...f, position: val }))}
                  placeholder="Select position"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">State</label>
                <SearchableSelect
                  options={formStates}
                  value={appointForm.state_id}
                  onChange={val => setAppointForm(f => ({ ...f, state_id: val }))}
                  placeholder="Select state"
                />
              </div>
              {formLGAs.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">LGA</label>
                  <SearchableSelect
                    options={formLGAs}
                    value={appointForm.lga_id}
                    onChange={val => setAppointForm(f => ({ ...f, lga_id: val }))}
                    placeholder="Select LGA"
                  />
                </div>
              )}
              {formWards.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Ward</label>
                  <SearchableSelect
                    options={formWards}
                    value={appointForm.ward_id}
                    onChange={val => setAppointForm(f => ({ ...f, ward_id: val }))}
                    placeholder="Select ward"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => setAppointModal(false)}>Cancel</Button>
                <Button type="submit" loading={appointLoading} disabled={!appointForm.user_id || !appointForm.position}>Appoint</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
