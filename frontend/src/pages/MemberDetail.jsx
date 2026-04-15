import './MemberDetail.css';
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
    <div className="member-detail">
      <button className="member-detail__back" onClick={() => navigate('/members')}>← Back</button>
      <Card padding="lg">
        <div className="member-detail__top">
          <Avatar src={member.profile_photo} name={member.full_name} size="lg" />
          <div>
            <h1 className="member-detail__name">{member.full_name}</h1>
            <Badge variant={statusVariant[member.voter_verification_status] || 'default'}>
              {member.voter_verification_status || 'Pending'}
            </Badge>
          </div>
        </div>
        <div className="member-detail__grid">
          <div className="member-detail__field"><label>Membership ID</label><span>{member.membership_id || '—'}</span></div>
          <div className="member-detail__field"><label>Role</label><span>{member.role?.replace(/_/g, ' ') || 'Member'}</span></div>
          <div className="member-detail__field"><label>State</label><span>{member.state_name || '—'}</span></div>
          <div className="member-detail__field"><label>LGA</label><span>{member.lga_name || '—'}</span></div>
          <div className="member-detail__field"><label>Ward</label><span>{member.ward_name || '—'}</span></div>
          <div className="member-detail__field"><label>Occupation</label><span>{member.occupation || '—'}</span></div>
          <div className="member-detail__field"><label>APC Membership</label><span>{member.apc_membership_number || '—'}</span></div>
          <div className="member-detail__field"><label>Joined</label><span>{member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-NG') : '—'}</span></div>
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
