import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import { useToastStore } from '../../store/toastStore';
import { cn } from '../../lib/cn';

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold">Platform Settings</h1>
        <Button onClick={handleSave} loading={saving}>Save Settings</Button>
      </div>

      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
        <Card padding="md">
          <h3 className="text-base font-bold mb-3">Platform Info</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Platform Name</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={settings.platform_name || 'City Boy Connect'} onChange={e => updateSetting('platform_name', e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Email</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={settings.contact_email || ''} onChange={e => updateSetting('contact_email', e.target.value)} type="email" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Maintenance Mode</label>
            <div className="flex items-center gap-3">
              <button
                className={cn(
                  'relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors',
                  settings.maintenance_mode ? 'bg-forest' : 'bg-gray-300'
                )}
                onClick={() => updateSetting('maintenance_mode', !settings.maintenance_mode)}
                type="button"
              >
                <span className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  settings.maintenance_mode ? 'translate-x-[22px]' : 'translate-x-0.5'
                )} />
              </button>
              <span className="text-sm text-gray-600">{settings.maintenance_mode ? 'ON — Site is in maintenance mode' : 'OFF'}</span>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-base font-bold mb-3">Authentication Methods</h3>
          <p className="text-xs text-gray-500 mb-3">
            Control how members can log in. You can restrict to SMS-only once the SMS provider is stable again.
          </p>

          {!settings.auth_sms_otp_enabled && !settings.auth_email_otp_enabled && !settings.auth_password_login_enabled && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-sm mb-3">⚠ All methods are disabled — members cannot log in.</div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">OTP via SMS</label>
            <div className="flex items-center gap-3">
              <button
                className={cn(
                  'relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors',
                  settings.auth_sms_otp_enabled ? 'bg-forest' : 'bg-gray-300'
                )}
                onClick={() => updateSetting('auth_sms_otp_enabled', !settings.auth_sms_otp_enabled)}
                type="button"
              >
                <span className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  settings.auth_sms_otp_enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                )} />
              </button>
              <span className="text-sm text-gray-600">
                {settings.auth_sms_otp_enabled ? 'Enabled — members receive a 6-digit code via text message' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">OTP via Email</label>
            <div className="flex items-center gap-3">
              <button
                className={cn(
                  'relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors',
                  settings.auth_email_otp_enabled ? 'bg-forest' : 'bg-gray-300'
                )}
                onClick={() => updateSetting('auth_email_otp_enabled', !settings.auth_email_otp_enabled)}
                type="button"
              >
                <span className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  settings.auth_email_otp_enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                )} />
              </button>
              <span className="text-sm text-gray-600">
                {settings.auth_email_otp_enabled ? 'Enabled — members receive a 6-digit code by email' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Password Login</label>
            <div className="flex items-center gap-3">
              <button
                className={cn(
                  'relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors',
                  settings.auth_password_login_enabled ? 'bg-forest' : 'bg-gray-300'
                )}
                onClick={() => updateSetting('auth_password_login_enabled', !settings.auth_password_login_enabled)}
                type="button"
              >
                <span className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  settings.auth_password_login_enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                )} />
              </button>
              <span className="text-sm text-gray-600">
                {settings.auth_password_login_enabled ? 'Enabled — members can set and use a password' : 'Disabled'}
              </span>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-base font-bold mb-3">OTP / SMS Settings</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">OTP Expiry (minutes)</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="number" value={settings.otp_expiry || 10} onChange={e => updateSetting('otp_expiry', parseInt(e.target.value))} min={1} max={60} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Max OTP Attempts</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="number" value={settings.max_otp_attempts || 3} onChange={e => updateSetting('max_otp_attempts', parseInt(e.target.value))} min={1} max={10} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowTestModal(true)} style={{ marginTop: '0.5rem' }}>Send Test SMS</Button>
        </Card>

        <Card padding="md">
          <h3 className="text-base font-bold mb-3">Membership Rules</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Voter Card Required</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={settings.voter_card_required ? 'yes' : 'no'} onChange={e => updateSetting('voter_card_required', e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Minimum Age</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="number" value={settings.min_age || 18} onChange={e => updateSetting('min_age', parseInt(e.target.value))} min={14} max={99} />
          </div>
        </Card>

        <Card padding="md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold">Leaderboard Weights</h3>
            <Button size="sm" variant="secondary" onClick={handleSaveWeights} loading={savingWeights}>Save Weights</Button>
          </div>
          <p className={cn('text-sm mb-3', weightsTotal !== 100 ? 'text-danger font-semibold' : 'text-gray-500')}>
            Total: {weightsTotal}% {weightsTotal !== 100 ? '(must equal 100%)' : '✓'}
          </p>
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3 mb-3">
              <label className="w-28 text-sm capitalize text-gray-700">{key.replace(/_/g, ' ')}</label>
              <input
                className="flex-1 accent-forest"
                type="range" min={0} max={100} value={val}
                onChange={e => setWeights(w => ({ ...w, [key]: parseInt(e.target.value) }))}
              />
              <span className="w-10 text-right text-sm font-semibold text-forest">{val}%</span>
            </div>
          ))}
        </Card>
      </div>

      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowTestModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-[400px] shadow-elevated" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Send Test SMS</h3>
            <form onSubmit={handleTestSMS}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" type="tel" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="e.g. 08012345678" required />
              </div>
              <div className="flex justify-end gap-2">
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
