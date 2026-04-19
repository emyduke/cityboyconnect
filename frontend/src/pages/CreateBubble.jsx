import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBubble } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Button from '../components/Button';

export default function CreateBubble() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'OTHER',
    description: '',
    contact_phone: user?.phone || '',
    contact_whatsapp: user?.phone || '',
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (form.title.length < 5) e.title = 'Title must be at least 5 characters';
    if (form.description.length < 20) e.description = 'Description must be at least 20 characters';
    if (!form.contact_phone) e.contact_phone = 'Phone is required';
    if (!form.contact_whatsapp) e.contact_whatsapp = 'WhatsApp is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(f => fd.append('images', f));
      await createBubble(fd);
      addToast({ type: 'success', message: 'Bubble submitted for review!' });
      navigate('/bubbles');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create bubble';
      addToast({ type: 'error', message: msg });
    }
    setSubmitting(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-[640px]">
      <h1 className="text-2xl font-extrabold mb-1">Create a Bubble</h1>
      <p className="text-gray-500 text-sm mb-8">Describe what your community needs</p>

      <form className="bg-white rounded-2xl shadow-soft p-6" onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">Title</label>
          <input className="w-full py-2 px-4 border-[1.5px] border-gray-200 rounded-lg text-sm bg-white transition-colors focus:border-forest focus:outline-none" type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Barber clippers for Wuse II ward" />
          {errors.title && <p className="text-danger text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">Category</label>
          <select className="w-full py-2 px-4 border-[1.5px] border-gray-200 rounded-lg text-sm bg-white transition-colors focus:border-forest focus:outline-none" value={form.category} onChange={e => update('category', e.target.value)}>
            <option value="TOOLS">Tools & Equipment</option>
            <option value="OPPORTUNITIES">Jobs & Opportunities</option>
            <option value="SERVICES">Services</option>
            <option value="SUPPORT">Local Support</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">Description</label>
          <textarea className="w-full py-2 px-4 border-[1.5px] border-gray-200 rounded-lg text-sm bg-white transition-colors focus:border-forest focus:outline-none min-h-[120px] resize-y" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe the need, who benefits, and how it helps the community..." />
          {errors.description && <p className="text-danger text-xs mt-1">{errors.description}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">Your Direct Phone</label>
          <input className="w-full py-2 px-4 border-[1.5px] border-gray-200 rounded-lg text-sm bg-white transition-colors focus:border-forest focus:outline-none" type="tel" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} />
          {errors.contact_phone && <p className="text-danger text-xs mt-1">{errors.contact_phone}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">Your WhatsApp Number</label>
          <input className="w-full py-2 px-4 border-[1.5px] border-gray-200 rounded-lg text-sm bg-white transition-colors focus:border-forest focus:outline-none" type="tel" value={form.contact_whatsapp} onChange={e => update('contact_whatsapp', e.target.value)} />
          {errors.contact_whatsapp && <p className="text-danger text-xs mt-1">{errors.contact_whatsapp}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-gray-700">Photos (optional, max 5)</label>
          <input type="file" accept="image/*" multiple onChange={e => setImages([...e.target.files].slice(0, 5))} />
        </div>

        <Button type="submit" loading={submitting} fullWidth>Submit Bubble for Review</Button>

        <div className="bg-[#f0fdf4] rounded-lg p-4 text-sm text-forest leading-relaxed mt-6">
          💡 Your bubble will be reviewed by the City Boy Connect team. We'll contact you on WhatsApp to discuss the details.
        </div>
      </form>
    </div>
  );
}
