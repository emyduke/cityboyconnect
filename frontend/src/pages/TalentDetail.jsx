import './Opportunities.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOpportunityProfile } from '../api/client';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import Card from '../components/Card';

export default function TalentDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getOpportunityProfile(userId);
        const data = res.data.data || res.data;
        setProfile(data.talent_profile || data);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton variant="card" /><Skeleton variant="text" width="60%" /></div>;
  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Profile not found</h2><Button onClick={() => navigate(-1)}>Go Back</Button></div>;

  const user = profile.user || {};

  return (
    <div className="opportunities" style={{ maxWidth: 800 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back to Search</button>
      <Card padding="lg">
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {user.profile_photo ? (
            <img src={user.profile_photo} alt="" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎨</div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0 }}>{user.full_name}</h1>
            <p style={{ color: '#6b7280', margin: '4px 0' }}>{profile.title}</p>
            <div className="opportunity-card__badges" style={{ marginTop: 8 }}>
              <span className="opportunity-card__badge opportunity-card__badge--category">{profile.category_display || profile.category}</span>
              {profile.years_of_experience > 0 && <span className="opportunity-card__badge">{profile.years_of_experience} years experience</span>}
              {profile.available_nationwide && <span className="opportunity-card__badge">🌍 Nationwide</span>}
            </div>
            {profile.service_state_name && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 8 }}>📍 {profile.service_state_name}{profile.service_lga_name ? `, ${profile.service_lga_name}` : ''}</p>
            )}
          </div>
        </div>
      </Card>

      {profile.bio && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>About</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{profile.bio}</p>
        </Card>
      )}

      {profile.portfolio_items?.length > 0 && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Portfolio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {profile.portfolio_items.map(p => (
              <div key={p.id} onClick={() => setLightbox(p.image)} style={{ cursor: 'pointer' }}>
                <img src={p.image} alt={p.title || ''} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                {p.title && <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#6b7280' }}>{p.title}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
        <h3>Contact</h3>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {profile.show_whatsapp && profile.whatsapp_number && (
            <Button size="sm" onClick={() => window.open(`https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g, '')}`, '_blank')}>WhatsApp</Button>
          )}
          {profile.show_phone && user.phone_number && (
            <Button size="sm" variant="secondary" onClick={() => window.open(`tel:${user.phone_number}`, '_self')}>Call</Button>
          )}
        </div>
      </Card>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
