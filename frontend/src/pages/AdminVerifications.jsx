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
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Pending Verifications</h1>
      <p className="text-gray-500 text-[0.9rem] mb-8">Review voter card submissions from members</p>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : members.length === 0 ? (
        <EmptyState title="No pending verifications" description="All voter cards have been reviewed" icon="✅" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {members.map(m => (
            <Card key={m.id} padding="md">
              <div className="flex items-center gap-4 mb-4">
                <Avatar src={m.profile_photo} name={m.full_name} size="md" />
                <div>
                  <h3 className="text-base font-semibold">{m.full_name}</h3>
                  <span className="text-[0.8rem] text-gray-400">{m.state_name} · {m.lga_name}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div><label className="block text-[0.7rem] text-gray-400 uppercase tracking-wide">VIN</label><span className="text-[0.85rem] font-medium font-mono">{m.voter_card_number || '—'}</span></div>
                <div><label className="block text-[0.7rem] text-gray-400 uppercase tracking-wide">Membership ID</label><span className="text-[0.85rem] font-medium font-mono">{m.membership_id || '—'}</span></div>
              </div>
              {m.voter_card_image && (
                <img src={m.voter_card_image} alt="Voter card" className="w-full max-h-[200px] object-cover rounded-sm mb-4 border border-gray-200" />
              )}
              <div className="flex gap-2">
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
