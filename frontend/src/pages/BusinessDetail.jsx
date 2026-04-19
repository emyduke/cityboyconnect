import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBusinessDetail } from '../api/client';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import Card from '../components/Card';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getBusinessDetail(id);
        setBiz(res.data.data || res.data);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton variant="card" /><Skeleton variant="text" width="60%" /></div>;
  if (!biz) return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Business not found</h2><Button onClick={() => navigate(-1)}>Go Back</Button></div>;

  const owner = biz.user || {};

  return (
    <div className="max-w-[800px] mx-auto">
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back to Search</button>

      <Card padding="lg">
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {biz.logo ? (
            <img src={biz.logo} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏢</div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0 }}>{biz.name}</h1>
            <div className="flex gap-1.5 flex-wrap mt-1" style={{ marginTop: 8 }}>
              <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-amber-100 text-amber-800">{biz.category_display || biz.category}</span>
              {biz.operates_nationwide && <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800">🌍 Nationwide</span>}
            </div>
          </div>
        </div>
      </Card>

      <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
        <h3>Owner</h3>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => navigate(`/members/${owner.id}`)}
        >
          {owner.profile_photo ? (
            <img src={owner.profile_photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
          )}
          <div>
            <strong>{owner.full_name}</strong>
            {owner.membership_id && <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>{owner.membership_id}</p>}
          </div>
        </div>
      </Card>

      {biz.description && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{biz.description}</p>
        </Card>
      )}

      {(biz.address || biz.state_name) && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Location</h3>
          {biz.address && <p style={{ color: '#374151' }}>{biz.address}</p>}
          {biz.state_name && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>📍 {biz.state_name}{biz.lga_name ? `, ${biz.lga_name}` : ''}</p>}
        </Card>
      )}

      {biz.images?.length > 0 && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Gallery</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {biz.images.map(img => (
              <div key={img.id} onClick={() => setLightbox(img.image)} style={{ cursor: 'pointer' }}>
                <img src={img.image} alt={img.caption || ''} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                {img.caption && <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#6b7280' }}>{img.caption}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
        <h3>Contact</h3>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {biz.phone && <Button size="sm" onClick={() => window.open(`tel:${biz.phone}`, '_self')}>📞 Call</Button>}
          {biz.whatsapp && <Button size="sm" onClick={() => window.open(`https://wa.me/${biz.whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}>💬 WhatsApp</Button>}
          {biz.email && <Button size="sm" variant="secondary" onClick={() => window.open(`mailto:${biz.email}`, '_self')}>✉️ Email</Button>}
          {biz.website && <Button size="sm" variant="secondary" onClick={() => window.open(biz.website, '_blank', 'noopener,noreferrer')}>🌐 Website</Button>}
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
