import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import './PlatformSettings.css';

export default function PlatformSettings() {
  const [settings, setSettings] = useState({});
  const [weights, setWeights] = useState({ onboarding: 40, attendance: 25, engagement: 20, network_depth: 15 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, weightsRes] = await Promise.all([
          adminApi.getSettings(),
          adminApi.getLeaderboardWeights().catch(() => ({ data: {} })),
        ]);
        const s = settingsRes.data || settingsRes;
        setSettings(Array.isArray(s) ? Object.fromEntries(s.map(i => [i.key, i.value])) : s);
        const w = weightsRes.data || weightsRes;
        if (w && typeof w === 'object' && Object.keys(w).length > 0) setWeights(w);
      } catch { addToast({ type: 'error', message: 'Failed to load settings' }); }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      addToast({ type: 'success', message: 'Settings saved' });
    } catch { addToast({ type: 'error', message: 'Failed to save settings' }); }
    setSaving(false);
  };

  const handleSaveWeights = async () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total !== 100) { addToast({ type: 'warning', message: `Weights must total 100% (currently ${total}%)` }); return; }
    setSavingWeights(true);
    try {
      await adminApi.updateLeaderboardWeights(weights);
      addToast({ type: 'success', message: 'Leaderboard weights saved' });
    } catch { addToast({ type: 'error', message: 'Failed to save weights' }); }
    setSavingWeights(false);
  };

  const handleTestSMS = async (e) => {
    e.preventDefault();
    if (!testPhone) return;
    setTestSending(true);
    try {
      await adminApi.testSMS(testPhone);
      addToast({ type: 'success', message: 'Test SMS sent' });
      setShowTestModal(false);
      setTestPhone('');
    } catch { addToast({ type: 'error', message: 'Failed to send test SMS' }); }
    setTestSending(false);
  };

  const updateSetting = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  if (loading) return <div style={{ padding: '1rem' }}><Skeleton variant="card" /><Skeleton variant="card" /></div>;

  const weightsTotal = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="admin-settings">
      <div className="admin-settings__header">
        <h1>Platform Settings</h1>
        <Button onClick={handleSave} loading={saving}>Save Settings</Button>
      </div>

      <div className="admin-settings__grid">
        <Card padding="md">
          <h3>Platform Info</h3>
          <div className="admin-settings__field">
            <label>Platform Name</label>
            <input value={settings.platform_name || 'City Boy Connect'} onChange={e => updateSetting('platform_name', e.target.value)} />
          </div>
          <div className="admin-settings__field">
            <label>Contact Email</label>
            <input value={settings.contact_email || ''} onChange={e => updateSetting('contact_email', e.target.value)} type="email" />
          </div>
          <div className="admin-settings__field">
            <label>Maintenance Mode</label>
            <div className="admin-settings__toggle-row">
              <button
                className={`admin-settings__toggle ${settings.maintenance_mode ? 'admin-settings__toggle--on' : ''}`}
                onClick={() => updateSetting('maintenance_mode', !settings.maintenance_mode)}
                type="button"
              >
                <span className="admin-settings__toggle-slider" />
              </button>
              <span className="admin-settings__toggle-label">{settings.maintenance_mode ? 'ON — Site is in maintenance mode' : 'OFF'}</span>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h3>OTP / SMS Settings</h3>
          <div className="admin-settings__field">
            <label>OTP Expiry (minutes)</label>
            <input type="number" value={settings.otp_expiry || 10} onChange={e => updateSetting('otp_expiry', parseInt(e.target.value))} min={1} max={60} />
          </div>
          <div className="admin-settings__field">
            <label>Max OTP Attempts</label>
            <input type="number" value={settings.max_otp_attempts || 3} onChange={e => updateSetting('max_otp_attempts', parseInt(e.target.value))} min={1} max={10} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowTestModal(true)} style={{ marginTop: 'var(--space-sm)' }}>Send Test SMS</Button>
        </Card>

        <Card padding="md">
          <h3>Membership Rules</h3>
          <div className="admin-settings__field">
            <label>Voter Card Required</label>
            <select value={settings.voter_card_required ? 'yes' : 'no'} onChange={e => updateSetting('voter_card_required', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="admin-settings__field">
            <label>Minimum Age</label>
            <input type="number" value={settings.min_age || 18} onChange={e => updateSetting('min_age', parseInt(e.target.value))} min={14} max={99} />
          </div>
        </Card>

        <Card padding="md">
          <div className="admin-settings__weight-header">
            <h3>Leaderboard Weights</h3>
            <Button size="sm" variant="secondary" onClick={handleSaveWeights} loading={savingWeights}>Save Weights</Button>
          </div>
          <p className={`admin-settings__weight-note ${weightsTotal !== 100 ? 'admin-settings__weight-note--invalid' : ''}`}>
            Total: {weightsTotal}% {weightsTotal !== 100 ? '(must equal 100%)' : '✓'}
          </p>
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} className="admin-settings__weight">
              <label>{key.replace(/_/g, ' ')}</label>
              <input
                type="range" min={0} max={100} value={val}
                onChange={e => setWeights(w => ({ ...w, [key]: parseInt(e.target.value) }))}
              />
              <span className="admin-settings__weight-value">{val}%</span>
            </div>
          ))}
        </Card>
      </div>

      {showTestModal && (
        <div className="admin-settings__modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="admin-settings__modal" onClick={e => e.stopPropagation()}>
            <h3>Send Test SMS</h3>
            <form onSubmit={handleTestSMS}>
              <div className="admin-settings__field">
                <label>Phone Number</label>
                <input type="tel" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="e.g. 08012345678" required />
              </div>
              <div className="admin-settings__modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowTestModal(false)}>Cancel</Button>
                <Button type="submit" loading={testSending}>Send Test</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
