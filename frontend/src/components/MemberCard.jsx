import Avatar from './Avatar';
import Badge from './Badge';

const statusVariant = { VERIFIED: 'success', PENDING: 'warning', REJECTED: 'danger' };

export default function MemberCard({ member, onClick }) {
  const maskedPhone = member.phone_number
    ? member.phone_number.slice(0, 3) + '****' + member.phone_number.slice(-4)
    : '';

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-[10px] cursor-pointer transition-shadow hover:shadow-elevated" onClick={onClick}>
      <Avatar src={member.profile_photo} name={member.full_name} size="lg" />
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <h4 className="text-[0.95rem] font-semibold text-gray-900 truncate">{member.full_name}</h4>
        <span className="text-[0.8rem] text-gray-500 font-mono">{maskedPhone}</span>
        <span className="text-[0.8rem] text-gray-400">{member.ward_name || member.lga_name || member.state_name || ''}</span>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant={statusVariant[member.voter_verification_status] || 'default'}>
          {member.voter_verification_status || 'Pending'}
        </Badge>
        {member.membership_id && <span className="text-[0.7rem] text-gray-400 font-mono">{member.membership_id}</span>}
      </div>
    </div>
  );
}
