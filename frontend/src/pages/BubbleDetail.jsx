import { cn } from '../lib/cn';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBubble, addBubbleImage } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';

const CATEGORY_COLORS = {
  TOOLS: 'bg-[#1a472a]',
  OPPORTUNITIES: 'bg-[#2563eb]',
  SERVICES: 'bg-[#ea580c]',
  SUPPORT: 'bg-[#7c3aed]',
  OTHER: 'bg-[#6b7280]',
};

const STATUS_COLORS = {
  PENDING: 'bg-[#fef3c7] text-[#854d0e]',
  IN_REVIEW: 'bg-[#3b82f6] text-white',
  APPROVED: 'bg-[#22c55e] text-white',
  IN_PROGRESS: 'bg-[#f97316] text-white',
  DELIVERED: 'bg-[#10b981] text-white',
  REJECTED: 'bg-[#ef4444] text-white',
  CANCELLED: 'bg-[#6b7280] text-white',
};

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

  if (loading) return <div className="max-w-[800px]"><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  if (!bubble) return <div className="max-w-[800px]"><p>Bubble not found.</p></div>;

  const isCreator = user?.id === bubble.created_by_id || user?.full_name === bubble.created_by_name;
  const canAddPhoto = isCreator && ['PENDING', 'IN_REVIEW'].includes(bubble.status);
  const requestImages = (bubble.images || []).filter(i => i.image_type === 'REQUEST');
  const deliveryImages = (bubble.images || []).filter(i => i.image_type === 'DELIVERY');

  return (
    <div className="max-w-[800px]">
      <button className="inline-flex items-center gap-1 text-forest font-medium text-sm mb-6 cursor-pointer bg-transparent border-none hover:underline" onClick={() => navigate('/bubbles')}>← Back to Bubbles</button>

      <div className="flex items-start gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">{bubble.title}</h1>
          <div className="flex gap-2 mt-1">
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold text-white', CATEGORY_COLORS[bubble.category])}>{bubble.category_display}</span>
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[bubble.status])}>{bubble.status_display}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
        <div className="mb-6 last:mb-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">Description</h3>
          <p className="leading-relaxed text-gray-700 whitespace-pre-wrap">{bubble.description}</p>
        </div>

        <div className="mb-6 last:mb-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">Location</h3>
          <div className="flex gap-6 flex-wrap text-sm text-gray-600">
            {bubble.state_name && <span>🏛 {bubble.state_name}</span>}
            {bubble.lga_name && <span>📍 {bubble.lga_name}</span>}
            {bubble.ward_name && <span>🏘 {bubble.ward_name}</span>}
          </div>
        </div>

        {(bubble.contact_phone || bubble.contact_whatsapp) && (
          <div className="mb-6 last:mb-0">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">Contact</h3>
            <div className="flex gap-6 flex-wrap">
              {bubble.contact_phone && (
                <a href={`tel:${bubble.contact_phone}`} className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg font-medium text-sm no-underline bg-forest-light text-forest">📞 {bubble.contact_phone}</a>
              )}
              {bubble.contact_whatsapp && (
                <a href={`https://wa.me/${bubble.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg font-medium text-sm no-underline bg-[#dcfce7] text-[#15803d]">💬 WhatsApp</a>
              )}
            </div>
          </div>
        )}

        {requestImages.length > 0 && (
          <div className="mb-6 last:mb-0">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">Photos</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
              {requestImages.map(img => (
                <img key={img.id} src={img.image} alt={img.caption || 'Bubble photo'} className="w-full h-[150px] object-cover rounded-lg cursor-pointer" />
              ))}
            </div>
          </div>
        )}

        {canAddPhoto && (
          <div className="mb-6 last:mb-0">
            <label>
              <Button size="sm" variant="secondary" as="span">+ Add Photo</Button>
              <input type="file" accept="image/*" onChange={handleAddImage} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {['SERVICES', 'ENTERTAINMENT', 'EDUCATION', 'TECHNOLOGY'].includes(bubble.category) && (
          <div className="bg-forest-light border border-forest rounded-lg py-2 px-4 mb-6 cursor-pointer text-sm text-forest hover:bg-forest hover:text-white" onClick={() => navigate(`/opportunities?tab=talents&search=${encodeURIComponent(bubble.category_display || bubble.category)}`)}>
            <span>💡 Looking for a specific talent? <strong>Search our directory →</strong></span>
          </div>
        )}

        {bubble.status === 'DELIVERED' && (
          <div className="mb-6 last:mb-0">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">Delivery</h3>
            <div className="bg-[#f0fdf4] rounded-lg p-4">
              <p>{bubble.delivery_notes}</p>
              {bubble.delivered_at && (
                <p className="text-sm text-gray-500">Delivered on {new Date(bubble.delivered_at).toLocaleDateString()}</p>
              )}
              {deliveryImages.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 mt-3">
                  {deliveryImages.map(img => (
                    <img key={img.id} src={img.image} alt={img.caption || 'Delivery proof'} className="w-full h-[150px] object-cover rounded-lg cursor-pointer" />
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
