import './CreateBubble.css';
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
    <div className="create-bubble">
      <h1 className="create-bubble__title">Create a Bubble</h1>
      <p className="create-bubble__subtitle">Describe what your community needs</p>

      <form className="create-bubble__form" onSubmit={handleSubmit}>
        <div className="create-bubble__field">
          <label>Title</label>
          <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Barber clippers for Wuse II ward" />
          {errors.title && <p className="create-bubble__error">{errors.title}</p>}
        </div>

        <div className="create-bubble__field">
          <label>Category</label>
          <select value={form.category} onChange={e => update('category', e.target.value)}>
            <option value="TOOLS">Tools & Equipment</option>
            <option value="OPPORTUNITIES">Jobs & Opportunities</option>
            <option value="SERVICES">Services</option>
            <option value="SUPPORT">Local Support</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="create-bubble__field">
          <label>Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe the need, who benefits, and how it helps the community..." />
          {errors.description && <p className="create-bubble__error">{errors.description}</p>}
        </div>

        <div className="create-bubble__field">
          <label>Your Direct Phone</label>
          <input type="tel" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} />
          {errors.contact_phone && <p className="create-bubble__error">{errors.contact_phone}</p>}
        </div>

        <div className="create-bubble__field">
          <label>Your WhatsApp Number</label>
          <input type="tel" value={form.contact_whatsapp} onChange={e => update('contact_whatsapp', e.target.value)} />
          {errors.contact_whatsapp && <p className="create-bubble__error">{errors.contact_whatsapp}</p>}
        </div>

        <div className="create-bubble__field">
          <label>Photos (optional, max 5)</label>
          <input type="file" accept="image/*" multiple onChange={e => setImages([...e.target.files].slice(0, 5))} />
        </div>

        <Button type="submit" loading={submitting} fullWidth>Submit Bubble for Review</Button>

        <div className="create-bubble__info">
          💡 Your bubble will be reviewed by the City Boy Connect team. We'll contact you on WhatsApp to discuss the details.
        </div>
      </form>
    </div>
  );
}
