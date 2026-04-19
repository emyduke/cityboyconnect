import { cn } from '../lib/cn';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchTalents, searchProfessionals, searchBusinesses,
  getTalentCategories, getBusinessCategories, getSkills, getStates,
} from '../api/client';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

const TABS = ['Talents', 'Professionals', 'Businesses'];

export default function Opportunities() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [talentCategories, setTalentCategories] = useState([]);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [skills, setSkillsList] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    Promise.all([
      getTalentCategories().catch(() => ({ data: { data: [] } })),
      getBusinessCategories().catch(() => ({ data: { data: [] } })),
      getSkills().catch(() => ({ data: { data: [] } })),
      getStates().catch(() => ({ data: { data: [] } })),
    ]).then(([tc, bc, sk, st]) => {
      setTalentCategories(tc.data.data || tc.data || []);
      setBusinessCategories(bc.data.data || bc.data || []);
      setSkillsList(sk.data.data || sk.data || []);
      setStates(st.data.data || st.data || []);
    });
  }, []);

  const fetchData = useCallback(async (resetPage = true) => {
    setLoading(true);
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    const params = { search, page: p };
    if (stateFilter) params.state = stateFilter;
    if (categoryFilter) params.category = categoryFilter;

    try {
      let res;
      if (tab === 0) res = await searchTalents(params);
      else if (tab === 1) {
        if (categoryFilter) { params.skill = categoryFilter; delete params.category; }
        res = await searchProfessionals(params);
      }
      else res = await searchBusinesses(params);

      const data = res.data.data?.results || res.data.results || res.data.data || res.data || [];
      if (resetPage) setResults(data);
      else setResults(prev => [...prev, ...data]);
      setHasMore(!!res.data.data?.next || !!res.data.next);
    } catch { setResults([]); }
    setLoading(false);
  }, [tab, search, stateFilter, categoryFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(true), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [tab, search, stateFilter, categoryFilter]);

  const loadMore = () => {
    setPage(p => p + 1);
    fetchData(false);
  };

  const categories = tab === 0 ? talentCategories : tab === 2 ? businessCategories : skills;

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1>Opportunities</h1>
        <Button size="sm" onClick={() => navigate('/opportunities/me')}>My Profiles</Button>
      </div>

      <div className="flex gap-1 mb-6 border-b-2 border-gray-200 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={cn(
              'px-4 py-2 border-none bg-transparent cursor-pointer font-semibold text-gray-500 border-b-2 border-transparent -mb-[2px] whitespace-nowrap transition-colors duration-200',
              tab === i && 'text-forest border-b-forest'
            )}
            onClick={() => { setTab(i); setCategoryFilter(''); setSearch(''); }}
          >
            {t}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1 mb-2">
          <button
            className={cn(
              'px-3 py-1 rounded-full border border-gray-200 bg-white cursor-pointer whitespace-nowrap text-[0.85rem] transition-colors duration-200',
              !categoryFilter && 'bg-forest text-white border-forest'
            )}
            onClick={() => setCategoryFilter('')}
          >
            All
          </button>
          {categories.map(c => {
            const val = c.value || c.slug || c.id;
            const label = c.label || c.name;
            return (
              <button
                key={val}
                className={cn(
                  'px-3 py-1 rounded-full border border-gray-200 bg-white cursor-pointer whitespace-nowrap text-[0.85rem] transition-colors duration-200',
                  categoryFilter === String(val) && 'bg-forest text-white border-forest'
                )}
                onClick={() => setCategoryFilter(String(val))}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap items-center max-md:flex-col">
        <input
          type="text"
          placeholder={tab === 0 ? 'Search talents...' : tab === 1 ? 'Search professionals...' : 'Search businesses...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-md:min-w-full px-4 py-2 border border-gray-200 rounded-lg text-[0.95rem]"
        />
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-[0.9rem] min-w-[140px]"
        >
          <option value="">All States</option>
          {states.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          <Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title={`No ${TABS[tab].toLowerCase()} found`}
          description="Try adjusting your search or filters"
          icon="🔍"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
            {results.map(item => (
              tab === 0 ? <TalentCard key={item.id} item={item} onClick={() => navigate(`/opportunities/talent/${item.user?.id || item.id}`)} /> :
              tab === 1 ? <ProfessionalCard key={item.id} item={item} onClick={() => navigate(`/opportunities/professional/${item.user?.id || item.id}`)} /> :
              <BusinessCard key={item.id} item={item} onClick={() => navigate(`/opportunities/business/${item.id}`)} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button variant="secondary" onClick={loadMore}>Load More</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TalentCard({ item, onClick }) {
  const profile = item.user || {};
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5" onClick={onClick}>
      <div className="flex items-center gap-2 mb-2">
        {profile.profile_photo ? (
          <img src={profile.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover bg-gray-200" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-[1.2rem]">🎨</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base whitespace-nowrap overflow-hidden text-ellipsis">{profile.full_name || item.title}</div>
          <div className="text-gray-500 text-[0.85rem]">{item.title}</div>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-1">
        <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-amber-100 text-amber-800">{item.category_display || item.category}</span>
        {item.years_of_experience > 0 && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800">{item.years_of_experience}y exp</span>}
      </div>
      <div className="flex items-center gap-2 mt-2 text-gray-500 text-[0.85rem]">
        {item.service_state_name && <span>📍 {item.service_state_name}{item.service_lga_name ? `, ${item.service_lga_name}` : ''}</span>}
        {item.available_nationwide && <span>🌍 Nationwide</span>}
      </div>
      {item.portfolio_items?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {item.portfolio_items.slice(0, 2).map(p => (
            <img key={p.id} src={p.image} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({ item, onClick }) {
  const profile = item.user || {};
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5" onClick={onClick}>
      <div className="flex items-center gap-2 mb-2">
        {profile.profile_photo ? (
          <img src={profile.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover bg-gray-200" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-[1.2rem]">💼</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base whitespace-nowrap overflow-hidden text-ellipsis">{profile.full_name || 'Professional'}</div>
          <div className="text-gray-500 text-[0.85rem]">{item.headline}</div>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-1">
        {(item.skills || []).slice(0, 3).map(s => (
          <span key={s.id || s} className="px-2 py-0.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800">{s.name || s}</span>
        ))}
        {item.cv_url && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-blue-100 text-blue-700">📄 CV</span>}
      </div>
      <div className="flex items-center gap-2 mt-2 text-gray-500 text-[0.85rem]">
        {profile.state_name && <span>📍 {profile.state_name}</span>}
      </div>
    </div>
  );
}

function BusinessCard({ item, onClick }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5" onClick={onClick}>
      <div className="flex items-center gap-2 mb-2">
        {item.logo ? (
          <img src={item.logo} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">🏢</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</div>
          <div className="text-gray-500 text-[0.85rem]">{item.category_display || item.category}</div>
        </div>
      </div>
      {item.description && (
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '8px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2 text-gray-500 text-[0.85rem]">
        {item.state_name && <span>📍 {item.state_name}{item.lga_name ? `, ${item.lga_name}` : ''}</span>}
        {item.operates_nationwide && <span>🌍 Nationwide</span>}
      </div>
    </div>
  );
}
