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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">My Profile</h1>
        <div className="flex gap-2">
          {!editing && <Button size="sm" onClick={() => { setEditing(true); setEditForm({ full_name: user.full_name || '', occupation: user.occupation || '', gender: user.gender || '' }); }}>Edit Profile</Button>}
          <Button size="sm" variant="secondary" loading={refreshing} onClick={refreshProfile}>Refresh</Button>
        </div>
      </div>

      {editing && (
        <Card padding="md" className="mb-4">
          <h3 className="mb-3">Edit Profile</h3>
          <div className="flex flex-col gap-3">
            <Input label="Full Name" value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
            <Input label="Occupation" value={editForm.occupation} onChange={e => setEditForm(p => ({ ...p, occupation: e.target.value }))} />
            <div>
              <label className="text-sm font-semibold block mb-1">Gender</label>
              <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className="w-full p-2.5 rounded-lg border border-gray-200 text-sm">
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="flex gap-2">
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

      <Card padding="lg">
        <div className="flex items-center gap-6 mb-8">
          <Avatar src={user.profile_photo} name={user.full_name} size="lg" />
          <div>
            <h2 className="text-xl font-bold">{user.full_name}</h2>
            <p className="text-sm text-gray-500 font-mono mb-1">{user.phone_number}</p>
            <Badge variant={statusVariant[user.voter_verification_status] || 'default'}>
              {user.voter_verification_status || 'Pending'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Membership ID</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.membership_id || '\u2014'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Role</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.role?.replace(/_/g, ' ') || 'Member'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">State</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.state_name || '\u2014'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">LGA</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.lga_name || '\u2014'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Ward</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.ward_name || '\u2014'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Occupation</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.occupation || '\u2014'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Gender</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : user.gender || '\u2014'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Referral Code</label><span className="text-[0.95rem] font-mono text-forest font-medium">{user.referral_code || '\u2014'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Joined</label><span className="text-[0.95rem] text-gray-700 font-medium">{user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-NG') : '\u2014'}</span></div>
        </div>
      </Card>

      <Card padding="md" className="mt-4 cursor-pointer" onClick={() => navigate('/opportunities/me')}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="m-0 text-base">💼 My Opportunity Profiles</h3>
            <p className="text-gray-500 text-sm mt-1 mb-0">Manage your professional, talent & business profiles</p>
          </div>
          <span className="text-gray-400">→</span>
        </div>
      </Card>
    </div>
  );
}
