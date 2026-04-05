import './AdminVerifications.css';
import { useState, useEffect } from 'react';
import { getPendingVerifications, verifyMember } from '../api/client';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useToastStore } from '../store/toastStore';

export default function AdminVerifications() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const addToast = useToastStore(s => s.addToast);

  const load = async () => {
    try {
      const res = await getPendingVerifications();
      setMembers(res.data.data || res.data.results || res.data || []);
    } catch { /* ok */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id, action) => {
    setProcessing(id);
    try {
      await verifyMember(id, action);
      addToast({ type: 'success', message: `Member ${action === 'approve' ? 'verified' : 'rejected'}` });
      setMembers(m => m.filter(x => x.id !== id));
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error?.message || 'Action failed' });
    }
    setProcessing(null);
  };

  return (
    <div className="admin-verify">
      <h1>Pending Verifications</h1>
      <p className="admin-verify__sub">Review voter card submissions from members</p>
      {loading ? (
        <div className="admin-verify__grid"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : members.length === 0 ? (
        <EmptyState title="No pending verifications" description="All voter cards have been reviewed" icon="✅" />
      ) : (
        <div className="admin-verify__grid">
          {members.map(m => (
            <Card key={m.id} padding="md" className="verify-card">
              <div className="verify-card__top">
                <Avatar src={m.profile_photo} name={m.full_name} size="md" />
                <div className="verify-card__info">
                  <h3>{m.full_name}</h3>
                  <span className="verify-card__meta">{m.state_name} · {m.lga_name}</span>
                </div>
              </div>
              <div className="verify-card__details">
                <div className="verify-card__field"><label>VIN</label><span>{m.voter_card_number || '—'}</span></div>
                <div className="verify-card__field"><label>Membership ID</label><span>{m.membership_id || '—'}</span></div>
              </div>
              {m.voter_card_image && (
                <img src={m.voter_card_image} alt="Voter card" className="verify-card__image" />
              )}
              <div className="verify-card__actions">
                <Button size="sm" loading={processing === m.id} onClick={() => handleVerify(m.id, 'approve')}>Approve</Button>
                <Button size="sm" variant="danger" loading={processing === m.id} onClick={() => handleVerify(m.id, 'reject')}>Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
