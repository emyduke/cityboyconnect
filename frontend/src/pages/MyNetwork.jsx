import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiChevronRight, FiChevronDown, FiUsers, FiUser, FiClock } from 'react-icons/fi';
import { getMyNetwork, getMyNetworkTree, getMyNetworkRecent } from '../api/client';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';
import './MyNetwork.css';

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const children = node.children || node.direct_referrals || [];
  const hasChildren = children.length > 0;

  const statusColor = {
    VERIFIED: 'var(--color-forest)',
    PENDING: 'var(--color-gold)',
    SUSPENDED: 'var(--color-danger)',
  }[node.status] || 'var(--color-text-secondary)';

  return (
    <div className="tree-node" style={{ '--depth': depth }}>
      <div className="tree-node__row" onClick={() => hasChildren && setOpen(!open)}>
        <span className="tree-node__toggle">
          {hasChildren ? (open ? <FiChevronDown /> : <FiChevronRight />) : <span className="tree-node__dot" />}
        </span>
        <Avatar name={node.full_name || ''} size="sm" />
        <div className="tree-node__info">
          <span className="tree-node__name">{node.full_name}</span>
          <span className="tree-node__meta">{node.ward_name || node.state_name || ''}</span>
        </div>
        <span className="tree-node__status" style={{ color: statusColor }}>{node.status}</span>
        {(node.direct_count ?? children.length) > 0 && (
          <span className="tree-node__count">{node.direct_count ?? children.length}</span>
        )}
      </div>
      {open && hasChildren && (
        <div className="tree-node__children">
          {children.map(c => <TreeNode key={c.id} node={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function MyNetwork() {
  const [tab, setTab] = useState('direct');
  const [directData, setDirectData] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'direct') {
        const res = await getMyNetwork();
        const d = res.data.data || res.data;
        setDirectData(Array.isArray(d) ? d : d.results || []);
      } else if (tab === 'tree') {
        const res = await getMyNetworkTree();
        setTreeData(res.data.data || res.data);
      } else {
        const res = await getMyNetworkRecent();
        const d = res.data.data || res.data;
        setRecentData(Array.isArray(d) ? d : d.results || []);
      }
    } catch { /* ok */ }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = directData.filter(m =>
    !search || (m.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { key: 'direct', label: 'Direct Recruits', icon: <FiUsers /> },
    { key: 'tree', label: 'Network Tree', icon: <FiUser /> },
    { key: 'recent', label: 'Recent Joins', icon: <FiClock /> },
  ];

  return (
    <div className="my-network">
      <h1 className="page-title">My Network</h1>

      <div className="network-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`network-tab ${tab === t.key ? 'network-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="network-loading">
          {[1,2,3].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        <>
          {tab === 'direct' && (
            <div className="network-direct">
              <div className="network-search">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search recruits..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {filtered.length === 0 ? (
                <p className="network-empty">No direct recruits yet. Share your QR code to grow your network!</p>
              ) : (
                <div className="network-list">
                  {filtered.map(m => (
                    <div key={m.id} className="network-item">
                      <Avatar name={m.full_name || ''} size="md" />
                      <div className="network-item__info">
                        <span className="network-item__name">{m.full_name}</span>
                        <span className="network-item__meta">{m.ward_name || m.state_name || ''}</span>
                      </div>
                      <div className="network-item__right">
                        <span className="network-item__date">
                          {m.date_joined ? new Date(m.date_joined).toLocaleDateString() : ''}
                        </span>
                        {m.direct_count > 0 && (
                          <span className="network-item__badge">{m.direct_count} recruits</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'tree' && (
            <div className="network-tree">
              {treeData ? (
                <TreeNode node={treeData} />
              ) : (
                <p className="network-empty">No network tree data available.</p>
              )}
            </div>
          )}

          {tab === 'recent' && (
            <div className="network-recent">
              {recentData.length === 0 ? (
                <p className="network-empty">No recent joins in the last 30 days.</p>
              ) : (
                <div className="network-timeline">
                  {recentData.map(m => (
                    <div key={m.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <Avatar name={m.full_name || ''} size="sm" />
                        <div className="timeline-info">
                          <span className="timeline-name">{m.full_name}</span>
                          <span className="timeline-meta">
                            {m.ward_name || m.state_name || ''} · Referred by {m.referred_by_name || 'you'}
                          </span>
                          <span className="timeline-date">
                            {m.date_joined ? new Date(m.date_joined).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
