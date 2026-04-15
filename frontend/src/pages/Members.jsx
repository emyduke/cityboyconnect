import './Members.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMemberDirectory } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { canAddMembers } from '../lib/permissions';
import MemberCard from '../components/MemberCard';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMemberDirectory({ search });
        setMembers(res.data.data || res.data.results || res.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="members-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1>Member Directory</h1>
        {canAddMembers(user?.role) && (
          <Button size="sm" onClick={() => navigate('/members/add')}>➕ Add Member</Button>
        )}
      </div>
      <div className="members-page__search">
        <input
          type="text"
          placeholder="Search by name, location, or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="members-page__search-input"
        />
      </div>
      {loading ? (
        <div className="members-grid"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : members.length === 0 ? (
        <EmptyState title="No members found" description="Try a different search term" icon="👥" />
      ) : (
        <div className="members-grid">
          {members.map(m => (
            <MemberCard key={m.id} member={m} onClick={() => navigate(`/members/${m.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
