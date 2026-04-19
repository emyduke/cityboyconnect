import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiChevronRight, FiChevronDown, FiUsers, FiUser, FiClock } from 'react-icons/fi';
import { getMyNetwork, getMyNetworkTree, getMyNetworkRecent } from '../api/client';
import { cn } from '../lib/cn';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';

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
    <div style={{ paddingLeft: `${depth * 1.5}rem` }}>
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-gray-50" onClick={() => hasChildren && setOpen(!open)}>
        <span className="w-5 flex items-center justify-center text-gray-500">
          {hasChildren ? (open ? <FiChevronDown /> : <FiChevronRight />) : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
        </span>
        <Avatar name={node.full_name || ''} size="sm" />
        <div className="flex-1 flex flex-col">
          <span className="font-semibold text-sm">{node.full_name}</span>
          <span className="text-xs text-gray-500">{node.ward_name || node.state_name || ''}</span>
        </div>
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: statusColor }}>{node.status}</span>
        {(node.direct_count ?? children.length) > 0 && (
          <span className="text-[0.7rem] bg-forest/10 text-forest px-2 py-0.5 rounded-full font-semibold">{node.direct_count ?? children.length}</span>
        )}
      </div>
      {open && hasChildren && (
        <div className="border-l border-dashed border-gray-300 ml-2.5">
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
        const d = res.data.data || res.data;
        setTreeData(d.tree || d);
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
    <div className="max-w-[900px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-4">My Network</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto max-sm:gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 border rounded-full cursor-pointer text-sm whitespace-nowrap transition-all duration-150 max-sm:text-xs max-sm:px-3 max-sm:py-2",
              tab === t.key ? "bg-forest text-white border-forest" : "bg-white border-gray-200"
            )}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : (
        <>
          {tab === 'direct' && (
            <div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-4">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search recruits..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 border-none outline-none bg-transparent text-sm"
                />
              </div>
              {filtered.length === 0 ? (
                <p className="text-center text-gray-500 py-12 px-4">No direct recruits yet. Share your QR code to grow your network!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map(m => (
                    <div key={m.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                      <Avatar name={m.full_name || ''} size="md" />
                      <div className="flex-1 flex flex-col">
                        <span className="font-semibold">{m.full_name}</span>
                        <span className="text-[0.8rem] text-gray-500">{m.ward_name || m.state_name || ''}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {m.added_by_leader && (
                          <span className="text-[0.7rem] bg-forest text-white px-1.5 py-0.5 rounded">Added by you</span>
                        )}
                        {!m.added_by_leader && (
                          <span className="text-[0.7rem] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Referred</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {m.date_joined ? new Date(m.date_joined).toLocaleDateString() : ''}
                        </span>
                        {m.direct_count > 0 && (
                          <span className="text-[0.7rem] bg-forest/10 text-forest px-2 py-0.5 rounded-full">{m.direct_count} recruits</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'tree' && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              {treeData ? (
                <TreeNode node={treeData} />
              ) : (
                <p className="text-center text-gray-500 py-12 px-4">No network tree data available.</p>
              )}
            </div>
          )}

          {tab === 'recent' && (
            <div>
              {recentData.length === 0 ? (
                <p className="text-center text-gray-500 py-12 px-4">No recent joins in the last 30 days.</p>
              ) : (
                <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-300">
                  {recentData.map(m => (
                    <div key={m.id} className="relative pb-6">
                      <div className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full bg-forest border-2 border-white" />
                      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200">
                        <Avatar name={m.full_name || ''} size="sm" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{m.full_name}</span>
                          <span className="text-[0.8rem] text-gray-500">
                            {m.ward_name || m.state_name || ''} · Referred by {m.referred_by_name || 'you'}
                          </span>
                          <span className="text-[0.7rem] text-gray-500">
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
