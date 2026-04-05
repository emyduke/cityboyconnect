import './MemberCard.css';
import Avatar from './Avatar';
import Badge from './Badge';

const statusVariant = { VERIFIED: 'success', PENDING: 'warning', REJECTED: 'danger' };

export default function MemberCard({ member, onClick }) {
  const maskedPhone = member.phone_number
    ? member.phone_number.slice(0, 3) + '****' + member.phone_number.slice(-4)
    : '';

  return (
    <div className="member-card" onClick={onClick}>
      <Avatar src={member.profile_photo} name={member.full_name} size="lg" />
      <div className="member-card__info">
        <h4 className="member-card__name">{member.full_name}</h4>
        <span className="member-card__phone">{maskedPhone}</span>
        <span className="member-card__location">{member.ward_name || member.lga_name || member.state_name || ''}</span>
      </div>
      <div className="member-card__meta">
        <Badge variant={statusVariant[member.voter_verification_status] || 'default'}>
          {member.voter_verification_status || 'Pending'}
        </Badge>
        {member.membership_id && <span className="member-card__id">{member.membership_id}</span>}
      </div>
    </div>
  );
}
