import './AdminMembers.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMembers } from '../api/client';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMembers({ page_size: 100 });
        setMembers(res.data.data || res.data.results || res.data || []);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, []);

  const statusVariant = { VERIFIED: 'success', PENDING: 'warning', REJECTED: 'danger' };

  const columns = [
    { key: 'membership_id', label: 'ID' },
    { key: 'full_name', label: 'Name', render: (v, row) => <span style={{ cursor: 'pointer', color: 'var(--color-forest)', fontWeight: 600 }} onClick={() => navigate(`/members/${row.id}`)}>{v}</span> },
    { key: 'state_name', label: 'State' },
    { key: 'lga_name', label: 'LGA' },
    { key: 'role', label: 'Role', render: v => v?.replace(/_/g, ' ') || 'Member' },
    { key: 'voter_verification_status', label: 'Verification', render: v => <Badge variant={statusVariant[v] || 'default'}>{v || 'Pending'}</Badge> },
  ];

  return (
    <div className="admin-members">
      <h1>All Members</h1>
      <DataTable columns={columns} data={members} searchable sortable loading={loading} emptyMessage="No members found" />
    </div>
  );
}
