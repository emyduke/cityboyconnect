import './Profile.css';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getMe } from '../api/client';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const addToast = useToastStore(s => s.addToast);
  const [refreshing, setRefreshing] = useState(false);

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
        <Button size="sm" variant="secondary" loading={refreshing} onClick={refreshProfile}>Refresh</Button>
      </div>

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
    </div>
  );
}
