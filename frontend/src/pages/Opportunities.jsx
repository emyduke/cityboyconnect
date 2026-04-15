import './Opportunities.css';
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
    <div className="opportunities">
      <div className="opportunities__header">
        <h1>Opportunities</h1>
        <Button size="sm" onClick={() => navigate('/opportunities/me')}>My Profiles</Button>
      </div>

      <div className="opportunities__tabs">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`opportunities__tab ${tab === i ? 'opportunities__tab--active' : ''}`}
            onClick={() => { setTab(i); setCategoryFilter(''); setSearch(''); }}
          >
            {t}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="opportunities__chips">
          <button
            className={`opportunities__chip ${!categoryFilter ? 'opportunities__chip--active' : ''}`}
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
                className={`opportunities__chip ${categoryFilter === String(val) ? 'opportunities__chip--active' : ''}`}
                onClick={() => setCategoryFilter(String(val))}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="opportunities__filters">
        <input
          type="text"
          placeholder={tab === 0 ? 'Search talents...' : tab === 1 ? 'Search professionals...' : 'Search businesses...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="opportunities__search"
        />
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="opportunities__filter-select"
        >
          <option value="">All States</option>
          {states.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="opportunities__grid">
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
          <div className="opportunities__grid">
            {results.map(item => (
              tab === 0 ? <TalentCard key={item.id} item={item} onClick={() => navigate(`/opportunities/talent/${item.user?.id || item.id}`)} /> :
              tab === 1 ? <ProfessionalCard key={item.id} item={item} onClick={() => navigate(`/opportunities/professional/${item.user?.id || item.id}`)} /> :
              <BusinessCard key={item.id} item={item} onClick={() => navigate(`/opportunities/business/${item.id}`)} />
            ))}
          </div>
          {hasMore && (
            <div className="opportunities__load-more">
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
    <div className="opportunity-card" onClick={onClick}>
      <div className="opportunity-card__header">
        {profile.profile_photo ? (
          <img src={profile.profile_photo} alt="" className="opportunity-card__avatar" />
        ) : (
          <div className="opportunity-card__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎨</div>
        )}
        <div className="opportunity-card__info">
          <div className="opportunity-card__name">{profile.full_name || item.title}</div>
          <div className="opportunity-card__subtitle">{item.title}</div>
        </div>
      </div>
      <div className="opportunity-card__badges">
        <span className="opportunity-card__badge opportunity-card__badge--category">{item.category_display || item.category}</span>
        {item.years_of_experience > 0 && <span className="opportunity-card__badge">{item.years_of_experience}y exp</span>}
      </div>
      <div className="opportunity-card__meta">
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
    <div className="opportunity-card" onClick={onClick}>
      <div className="opportunity-card__header">
        {profile.profile_photo ? (
          <img src={profile.profile_photo} alt="" className="opportunity-card__avatar" />
        ) : (
          <div className="opportunity-card__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💼</div>
        )}
        <div className="opportunity-card__info">
          <div className="opportunity-card__name">{profile.full_name || 'Professional'}</div>
          <div className="opportunity-card__subtitle">{item.headline}</div>
        </div>
      </div>
      <div className="opportunity-card__badges">
        {(item.skills || []).slice(0, 3).map(s => (
          <span key={s.id || s} className="opportunity-card__badge">{s.name || s}</span>
        ))}
        {item.cv_url && <span className="opportunity-card__badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>📄 CV</span>}
      </div>
      <div className="opportunity-card__meta">
        {profile.state_name && <span>📍 {profile.state_name}</span>}
      </div>
    </div>
  );
}

function BusinessCard({ item, onClick }) {
  return (
    <div className="opportunity-card" onClick={onClick}>
      <div className="opportunity-card__header">
        {item.logo ? (
          <img src={item.logo} alt="" className="opportunity-card__logo" />
        ) : (
          <div className="opportunity-card__logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: '#f3f4f6' }}>🏢</div>
        )}
        <div className="opportunity-card__info">
          <div className="opportunity-card__name">{item.name}</div>
          <div className="opportunity-card__subtitle">{item.category_display || item.category}</div>
        </div>
      </div>
      {item.description && (
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '8px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.description}
        </p>
      )}
      <div className="opportunity-card__meta">
        {item.state_name && <span>📍 {item.state_name}{item.lga_name ? `, ${item.lga_name}` : ''}</span>}
        {item.operates_nationwide && <span>🌍 Nationwide</span>}
      </div>
    </div>
  );
}
