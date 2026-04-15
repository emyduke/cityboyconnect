import './BubbleDetail.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBubble, addBubbleImage } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

export default function BubbleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bubble, setBubble] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getBubble(id);
        setBubble(res.data?.data || res.data);
      } catch { addToast({ type: 'error', message: 'Failed to load bubble' }); }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAddImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      await addBubbleImage(id, fd);
      addToast({ type: 'success', message: 'Photo added' });
      const res = await getBubble(id);
      setBubble(res.data?.data || res.data);
    } catch { addToast({ type: 'error', message: 'Failed to upload photo' }); }
  };

  if (loading) return <div className="bubble-detail"><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  if (!bubble) return <div className="bubble-detail"><p>Bubble not found.</p></div>;

  const isCreator = user?.id === bubble.created_by_id || user?.full_name === bubble.created_by_name;
  const canAddPhoto = isCreator && ['PENDING', 'IN_REVIEW'].includes(bubble.status);
  const requestImages = (bubble.images || []).filter(i => i.image_type === 'REQUEST');
  const deliveryImages = (bubble.images || []).filter(i => i.image_type === 'DELIVERY');

  return (
    <div className="bubble-detail">
      <button className="bubble-detail__back" onClick={() => navigate('/bubbles')}>← Back to Bubbles</button>

      <div className="bubble-detail__header">
        <div>
          <h1 className="bubble-detail__title">{bubble.title}</h1>
          <div className="bubble-detail__badges">
            <span className={`badge--category badge--cat-${bubble.category}`}>{bubble.category_display}</span>
            <span className={`badge--status badge--st-${bubble.status}`}>{bubble.status_display}</span>
          </div>
        </div>
      </div>

      <div className="bubble-detail__body">
        <div className="bubble-detail__section">
          <h3 className="bubble-detail__section-title">Description</h3>
          <p className="bubble-detail__desc">{bubble.description}</p>
        </div>

        <div className="bubble-detail__section">
          <h3 className="bubble-detail__section-title">Location</h3>
          <div className="bubble-detail__location">
            {bubble.state_name && <span>🏛 {bubble.state_name}</span>}
            {bubble.lga_name && <span>📍 {bubble.lga_name}</span>}
            {bubble.ward_name && <span>🏘 {bubble.ward_name}</span>}
          </div>
        </div>

        {(bubble.contact_phone || bubble.contact_whatsapp) && (
          <div className="bubble-detail__section">
            <h3 className="bubble-detail__section-title">Contact</h3>
            <div className="bubble-detail__contact">
              {bubble.contact_phone && (
                <a href={`tel:${bubble.contact_phone}`} className="phone-link">📞 {bubble.contact_phone}</a>
              )}
              {bubble.contact_whatsapp && (
                <a href={`https://wa.me/${bubble.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="whatsapp-link">💬 WhatsApp</a>
              )}
            </div>
          </div>
        )}

        {requestImages.length > 0 && (
          <div className="bubble-detail__section">
            <h3 className="bubble-detail__section-title">Photos</h3>
            <div className="bubble-detail__images">
              {requestImages.map(img => (
                <img key={img.id} src={img.image} alt={img.caption || 'Bubble photo'} />
              ))}
            </div>
          </div>
        )}

        {canAddPhoto && (
          <div className="bubble-detail__section">
            <label>
              <Button size="sm" variant="secondary" as="span">+ Add Photo</Button>
              <input type="file" accept="image/*" onChange={handleAddImage} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {['SERVICES', 'ENTERTAINMENT', 'EDUCATION', 'TECHNOLOGY'].includes(bubble.category) && (
          <div className="bubble-detail__suggestion" onClick={() => navigate(`/opportunities?tab=talents&search=${encodeURIComponent(bubble.category_display || bubble.category)}`)}>
            <span>💡 Looking for a specific talent? <strong>Search our directory →</strong></span>
          </div>
        )}

        {bubble.status === 'DELIVERED' && (
          <div className="bubble-detail__section">
            <h3 className="bubble-detail__section-title">Delivery</h3>
            <div className="bubble-detail__delivery">
              <p>{bubble.delivery_notes}</p>
              {bubble.delivered_at && (
                <p className="bubble-detail__delivery-date">Delivered on {new Date(bubble.delivered_at).toLocaleDateString()}</p>
              )}
              {deliveryImages.length > 0 && (
                <div className="bubble-detail__images" style={{ marginTop: '12px' }}>
                  {deliveryImages.map(img => (
                    <img key={img.id} src={img.image} alt={img.caption || 'Delivery proof'} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
