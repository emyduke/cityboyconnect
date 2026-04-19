import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMember } from '../api/client';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMember(id);
        setMember(res.data.data || res.data);
      } catch { navigate('/members'); }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  if (loading) return <div><Skeleton variant="card" /></div>;
  if (!member) return null;

  const statusVariant = { VERIFIED: 'success', PENDING: 'warning', REJECTED: 'danger' };

  return (
    <div className="flex flex-col gap-6">
      <button className="bg-transparent border-none text-forest text-sm cursor-pointer font-medium self-start hover:underline" onClick={() => navigate('/members')}>← Back</button>
      <Card padding="lg">
        <div className="flex items-center gap-6 mb-8">
          <Avatar src={member.profile_photo} name={member.full_name} size="lg" />
          <div>
            <h1 className="text-2xl font-extrabold mb-1">{member.full_name}</h1>
            <Badge variant={statusVariant[member.voter_verification_status] || 'default'}>
              {member.voter_verification_status || 'Pending'}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Membership ID</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.membership_id || '—'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Role</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.role?.replace(/_/g, ' ') || 'Member'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">State</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.state_name || '—'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">LGA</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.lga_name || '—'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Ward</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.ward_name || '—'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Occupation</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.occupation || '—'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">APC Membership</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.apc_membership_number || '—'}</span></div>
          <div className="flex flex-col gap-0.5"><label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Joined</label><span className="text-[0.95rem] text-gray-700 font-medium">{member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-NG') : '—'}</span></div>
        </div>

        {(member.has_professional_profile || member.has_talent_profile || member.business_listings_count > 0) && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {member.has_professional_profile && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/opportunities/professional/${member.user_id || id}`)}>View Professional Profile</Button>
            )}
            {member.has_talent_profile && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/opportunities/talent/${member.user_id || id}`)}>View Talent Profile</Button>
            )}
            {member.business_listings_count > 0 && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/opportunities?tab=businesses&owner=${member.user_id || id}`)}>View Businesses</Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
