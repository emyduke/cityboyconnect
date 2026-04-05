import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { getStates, getLGAs, getWards } from '../../api/client';
import SearchableSelect from '../../components/SearchableSelect';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import './StructureOrgChart.css';

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
    <div className="admin-structure">
      <div className="admin-structure__header">
        <h1>Structure & Leaders</h1>
        <Button size="sm" onClick={() => setAppointModal(true)}>+ Appoint Leader</Button>
      </div>
      <div className="admin-structure__selector">
        <SearchableSelect label="Select State" options={states} value={selectedState} onChange={handleStateChange} placeholder="Choose a state to view" />
      </div>

      {loading && (
        <div className="admin-structure__grid">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
      )}

      {!loading && orgChart && (
        <div className="admin-structure__tree">
          {leadership.length > 0 ? (
            <div className="admin-structure__leaders-grid">
              {leadership.map((leader, i) => (
                <Card key={i} padding="md" className="admin-structure__node">
                  <div className="admin-structure__node-content">
                    <Avatar name={leader.member_name || '—'} size="md" />
                    <div className="admin-structure__node-info">
                      <div className="admin-structure__node-name">{leader.member_name || 'Vacant'}</div>
                      <div className="admin-structure__node-title">{leader.position_title || leader.position || leader.role}</div>
                      <div className="admin-structure__node-meta">{leader.level_name || leader.scope || ''}</div>
                    </div>
                    <button className="admin-structure__remove-btn" onClick={() => handleRemove(leader.id || leader.pk)} title="Remove">✕</button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="admin-structure__empty">
              <span className="admin-structure__empty-icon">🏛</span>
              <p>No leaders assigned for this state</p>
              <p className="admin-structure__empty-sub">Use "Appoint Leader" to assign positions</p>
            </div>
          )}

          {orgChart.lgas && orgChart.lgas.length > 0 && (
            <>
              <h3 className="admin-structure__section-title">LGAs ({orgChart.lgas.length})</h3>
              <div className="admin-structure__lga-grid">
                {orgChart.lgas.map((lga, i) => (
                  <Card key={i} padding="sm" className="admin-structure__lga-node">
                    <div className="admin-structure__lga-name">{lga.name}</div>
                    <div className="admin-structure__lga-meta">{lga.member_count || 0} members</div>
                    {lga.leader_name && <div className="admin-structure__lga-leader">👤 {lga.leader_name}</div>}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !orgChart && selectedState && (
        <div className="admin-structure__empty">
          <p>Could not load structure data</p>
        </div>
      )}

      {!selectedState && !loading && (
        <div className="admin-structure__empty">
          <span className="admin-structure__empty-icon">🗺️</span>
          <p>Select a state to view its structure</p>
        </div>
      )}

      {appointModal && (
        <div className="admin-structure__modal-overlay" onClick={() => setAppointModal(false)}>
          <div className="admin-structure__modal" onClick={e => e.stopPropagation()}>
            <h3>Appoint Leader</h3>
            <p className="admin-structure__modal-sub">Select a member and assign a leadership position</p>
            <form onSubmit={handleAppoint} className="admin-structure__appoint-form">
              <div className="admin-structure__field">
                <label>Member</label>
                <SearchableSelect
                  options={memberOptions}
                  value={appointForm.user_id}
                  onChange={val => setAppointForm(f => ({ ...f, user_id: val }))}
                  placeholder={memberSearchLoading ? 'Searching...' : 'Type member name to search...'}
                  onSearchChange={setMemberSearch}
                />
              </div>
              <div className="admin-structure__field">
                <label>Position</label>
                <SearchableSelect
                  options={POSITIONS}
                  value={appointForm.position}
                  onChange={val => setAppointForm(f => ({ ...f, position: val }))}
                  placeholder="Select position"
                />
              </div>
              <div className="admin-structure__field">
                <label>State</label>
                <SearchableSelect
                  options={formStates}
                  value={appointForm.state_id}
                  onChange={val => setAppointForm(f => ({ ...f, state_id: val }))}
                  placeholder="Select state"
                />
              </div>
              {formLGAs.length > 0 && (
                <div className="admin-structure__field">
                  <label>LGA</label>
                  <SearchableSelect
                    options={formLGAs}
                    value={appointForm.lga_id}
                    onChange={val => setAppointForm(f => ({ ...f, lga_id: val }))}
                    placeholder="Select LGA"
                  />
                </div>
              )}
              {formWards.length > 0 && (
                <div className="admin-structure__field">
                  <label>Ward</label>
                  <SearchableSelect
                    options={formWards}
                    value={appointForm.ward_id}
                    onChange={val => setAppointForm(f => ({ ...f, ward_id: val }))}
                    placeholder="Select ward"
                  />
                </div>
              )}
              <div className="admin-structure__modal-actions">
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
