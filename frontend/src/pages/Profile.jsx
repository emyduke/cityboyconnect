import './Profile.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getMe, updateMyProfile } from '../api/client';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  const refreshProfile = async () => {
    setRefreshing(true);
    try {
      const res = await getMe();
      setUser(res.data.data || res.data);
      addToast({ type: 'success', message: 'Profile refreshed' });
    } catch { addToast({ type: 'error', message: 'Failed to refresh' }); }
    setRefreshing(false);
  };

  if (!user) return null;

  const statusVariant = { VERIFIED: 'success', PENDING: 'warning', REJECTED: 'danger' };

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1>My Profile</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!editing && <Button size="sm" onClick={() => { setEditing(true); setEditForm({ full_name: user.full_name || '', occupation: user.occupation || '', gender: user.gender || '' }); }}>Edit Profile</Button>}
          <Button size="sm" variant="secondary" loading={refreshing} onClick={refreshProfile}>Refresh</Button>
        </div>
      </div>

      {editing && (
        <Card padding="md" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Edit Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Input label="Full Name" value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
            <Input label="Occupation" value={editForm.occupation} onChange={e => setEditForm(p => ({ ...p, occupation: e.target.value }))} />
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Gender</label>
              <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button loading={saving} onClick={async () => {
                setSaving(true);
                try {
                  await updateMyProfile(editForm);
                  const res = await getMe();
                  setUser(res.data.data || res.data);
                  addToast({ type: 'success', message: 'Profile updated' });
                  setEditing(false);
                } catch { addToast({ type: 'error', message: 'Failed to update' }); }
                setSaving(false);
              }}>Save</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="lg" className="profile-card">
        <div className="profile-card__top">
          <Avatar src={user.profile_photo} name={user.full_name} size="lg" />
          <div>
            <h2 className="profile-card__name">{user.full_name}</h2>
            <p className="profile-card__phone">{user.phone_number}</p>
            <Badge variant={statusVariant[user.voter_verification_status] || 'default'}>
              {user.voter_verification_status || 'Pending'}
            </Badge>
          </div>
        </div>

        <div className="profile-card__grid">
          <div className="profile-field"><label>Membership ID</label><span>{user.membership_id || '—'}</span></div>
          <div className="profile-field"><label>Role</label><span>{user.role?.replace(/_/g, ' ') || 'Member'}</span></div>
          <div className="profile-field"><label>State</label><span>{user.state_name || '—'}</span></div>
          <div className="profile-field"><label>LGA</label><span>{user.lga_name || '—'}</span></div>
          <div className="profile-field"><label>Ward</label><span>{user.ward_name || '—'}</span></div>
          <div className="profile-field"><label>Occupation</label><span>{user.occupation || '—'}</span></div>
          <div className="profile-field"><label>Gender</label><span>{user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : user.gender || '—'}</span></div>
          <div className="profile-field"><label>Referral Code</label><span className="profile-mono">{user.referral_code || '—'}</span></div>
          <div className="profile-field"><label>Joined</label><span>{user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-NG') : '—'}</span></div>
        </div>
      </Card>

      <Card padding="md" style={{ marginTop: '1rem', cursor: 'pointer' }} onClick={() => navigate('/opportunities/me')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>💼 My Opportunity Profiles</h3>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Manage your professional, talent & business profiles</p>
          </div>
          <span style={{ color: 'var(--color-text-secondary)' }}>→</span>
        </div>
      </Card>
    </div>
  );
}
