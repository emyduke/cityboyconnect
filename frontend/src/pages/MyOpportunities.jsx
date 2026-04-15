import './Opportunities.css';
import { useState, useEffect, useCallback } from 'react';
import {
  getMyProfessionalProfile, createProfessionalProfile, updateProfessionalProfile, deleteProfessionalProfile,
  getMyTalentProfile, createTalentProfile, updateTalentProfile, deleteTalentProfile,
  addPortfolioItem, removePortfolioItem,
  getMyBusinessListings, createBusinessListing, updateBusinessListing, deleteBusinessListing,
  addBusinessImage, removeBusinessImage,
  getSkills, getTalentCategories, getBusinessCategories, getStates, getLGAs,
} from '../api/client';
import { useAuthStore } from '../store/authStore';
import Card from '../components/Card';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import { useToastStore } from '../store/toastStore';

export default function MyOpportunities() {
  const user = useAuthStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const showToast = (msg, type = 'success') => addToast({ message: msg, type });
  const [loading, setLoading] = useState(true);
  const [profProfile, setProfProfile] = useState(null);
  const [talentProfile, setTalentProfile] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [editSection, setEditSection] = useState(null);

  const [skills, setSkillsList] = useState([]);
  const [talentCats, setTalentCats] = useState([]);
  const [bizCats, setBizCats] = useState([]);
  const [states, setStates] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pp, tp, bl, sk, tc, bc, st] = await Promise.all([
        getMyProfessionalProfile().catch(() => null),
        getMyTalentProfile().catch(() => null),
        getMyBusinessListings().catch(() => ({ data: { data: [] } })),
        getSkills().catch(() => ({ data: { data: [] } })),
        getTalentCategories().catch(() => ({ data: { data: [] } })),
        getBusinessCategories().catch(() => ({ data: { data: [] } })),
        getStates().catch(() => ({ data: { data: [] } })),
      ]);
      setProfProfile(pp?.data?.data || null);
      setTalentProfile(tp?.data?.data || null);
      setBusinesses(bl.data.data?.results || bl.data.data || bl.data.results || []);
      setSkillsList(sk.data.data || sk.data || []);
      setTalentCats(tc.data.data || tc.data || []);
      setBizCats(bc.data.data || bc.data || []);
      setStates(st.data.data || st.data || []);
    } catch { /* ok */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>;

  return (
    <div className="opportunities">
      <h1>My Opportunities</h1>
      <p style={{ color: '#6b7280', marginBottom: 'var(--space-lg)' }}>Manage your professional profiles and business listings</p>

      {/* Professional Profile Section */}
      <Card padding="md" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>💼 Professional Profile</h3>
          {profProfile ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={() => setEditSection(editSection === 'professional' ? null : 'professional')}>Edit</Button>
              <Button size="sm" variant="danger" onClick={async () => {
                if (!confirm('Delete your professional profile?')) return;
                try { await deleteProfessionalProfile(); setProfProfile(null); showToast('Professional profile deleted', 'success'); } catch { showToast('Failed to delete', 'error'); }
              }}>Delete</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setEditSection('professional')}>Create Profile</Button>
          )}
        </div>
        {profProfile && editSection !== 'professional' && (
          <div style={{ marginTop: 12 }}>
            <p><strong>{profProfile.headline}</strong></p>
            {profProfile.skills?.length > 0 && <div className="opportunity-card__badges">{profProfile.skills.map(s => <span key={s.id} className="opportunity-card__badge">{s.name}</span>)}</div>}
            {profProfile.cv_url && <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: 8 }}>📄 CV uploaded</p>}
          </div>
        )}
        {editSection === 'professional' && (
          <ProfessionalForm
            initial={profProfile}
            skills={skills}
            onSave={async (data) => {
              try {
                const res = profProfile ? await updateProfessionalProfile(data) : await createProfessionalProfile(data);
                setProfProfile(res.data.data || res.data);
                setEditSection(null);
                showToast(profProfile ? 'Profile updated' : 'Profile created', 'success');
              } catch (e) { showToast(e.response?.data?.message || 'Failed to save', 'error'); }
            }}
            onCancel={() => setEditSection(null)}
          />
        )}
      </Card>

      {/* Talent Profile Section */}
      <Card padding="md" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🎨 Talent Profile</h3>
          {talentProfile ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={() => setEditSection(editSection === 'talent' ? null : 'talent')}>Edit</Button>
              <Button size="sm" variant="danger" onClick={async () => {
                if (!confirm('Delete your talent profile?')) return;
                try { await deleteTalentProfile(); setTalentProfile(null); showToast('Talent profile deleted', 'success'); } catch { showToast('Failed to delete', 'error'); }
              }}>Delete</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setEditSection('talent')}>Create Profile</Button>
          )}
        </div>
        {talentProfile && editSection !== 'talent' && (
          <div style={{ marginTop: 12 }}>
            <p><strong>{talentProfile.title}</strong> — {talentProfile.category_display || talentProfile.category}</p>
            {talentProfile.portfolio_items?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {talentProfile.portfolio_items.map(p => (
                  <img key={p.id} src={p.image} alt="" style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover' }} />
                ))}
              </div>
            )}
          </div>
        )}
        {editSection === 'talent' && (
          <TalentForm
            initial={talentProfile}
            categories={talentCats}
            states={states}
            onSave={async (data) => {
              try {
                const res = talentProfile ? await updateTalentProfile(data) : await createTalentProfile(data);
                setTalentProfile(res.data.data || res.data);
                setEditSection(null);
                showToast(talentProfile ? 'Profile updated' : 'Profile created', 'success');
              } catch (e) { showToast(e.response?.data?.message || 'Failed to save', 'error'); }
            }}
            onCancel={() => setEditSection(null)}
            onPortfolioAdd={async (formData) => {
              try {
                await addPortfolioItem(formData);
                load();
                showToast('Portfolio item added', 'success');
              } catch { showToast('Failed to add portfolio item', 'error'); }
            }}
            onPortfolioRemove={async (id) => {
              try {
                await removePortfolioItem(id);
                load();
                showToast('Portfolio item removed', 'success');
              } catch { showToast('Failed to remove', 'error'); }
            }}
          />
        )}
      </Card>

      {/* Business Listings Section */}
      <Card padding="md" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🏢 Business Listings</h3>
          <Button size="sm" onClick={() => setEditSection('business-new')}>Add Business</Button>
        </div>
        {businesses.length === 0 && editSection !== 'business-new' && (
          <p style={{ color: '#6b7280', marginTop: 12 }}>No business listings yet. Add your first business!</p>
        )}
        {businesses.map(b => (
          <div key={b.id} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{b.name}</strong>
                <span className="opportunity-card__badge opportunity-card__badge--category" style={{ marginLeft: 8 }}>{b.category_display || b.category}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" onClick={() => setEditSection(editSection === `business-${b.id}` ? null : `business-${b.id}`)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={async () => {
                  if (!confirm(`Delete ${b.name}?`)) return;
                  try { await deleteBusinessListing(b.id); setBusinesses(businesses.filter(x => x.id !== b.id)); showToast('Business deleted', 'success'); } catch { showToast('Failed to delete', 'error'); }
                }}>Delete</Button>
              </div>
            </div>
            {editSection === `business-${b.id}` && (
              <BusinessForm
                initial={b}
                categories={bizCats}
                states={states}
                onSave={async (data) => {
                  try {
                    await updateBusinessListing(b.id, data);
                    showToast('Business updated', 'success');
                    setEditSection(null);
                    load();
                  } catch (e) { showToast(e.response?.data?.message || 'Failed to save', 'error'); }
                }}
                onCancel={() => setEditSection(null)}
                onImageAdd={async (formData) => {
                  try { await addBusinessImage(b.id, formData); load(); showToast('Image added', 'success'); } catch { showToast('Failed to add image', 'error'); }
                }}
                onImageRemove={async (imgId) => {
                  try { await removeBusinessImage(b.id, imgId); load(); showToast('Image removed', 'success'); } catch { showToast('Failed', 'error'); }
                }}
              />
            )}
          </div>
        ))}
        {editSection === 'business-new' && (
          <BusinessForm
            categories={bizCats}
            states={states}
            onSave={async (data) => {
              try {
                const fd = new FormData();
                Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') fd.append(k, v); });
                await createBusinessListing(fd);
                showToast('Business created', 'success');
                setEditSection(null);
                load();
              } catch (e) { showToast(e.response?.data?.message || 'Failed to create', 'error'); }
            }}
            onCancel={() => setEditSection(null)}
          />
        )}
      </Card>
    </div>
  );
}

function ProfessionalForm({ initial, skills, onSave, onCancel }) {
  const [headline, setHeadline] = useState(initial?.headline || '');
  const [bio, setBio] = useState(initial?.bio || '');
  const [selectedSkills, setSelectedSkills] = useState(initial?.skills?.map(s => s.name) || []);
  const [skillInput, setSkillInput] = useState('');
  const [education, setEducation] = useState(initial?.education || []);
  const [workExperience, setWorkExperience] = useState(initial?.work_experience || []);
  const [saving, setSaving] = useState(false);

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !selectedSkills.includes(val)) setSelectedSkills([...selectedSkills, val]);
    setSkillInput('');
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Headline</label>
        <input value={headline} onChange={e => setHeadline(e.target.value)} className="opportunities__search" placeholder="e.g. Full-Stack Developer" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} className="opportunities__search" rows={3} placeholder="Tell people about yourself..." />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Skills</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="opportunities__search" list="skill-list" placeholder="Type a skill..." />
          <Button size="sm" type="button" onClick={addSkill}>Add</Button>
        </div>
        <datalist id="skill-list">{skills.map(s => <option key={s.id} value={s.name} />)}</datalist>
        <div className="opportunity-card__badges">
          {selectedSkills.map(s => (
            <span key={s} className="opportunity-card__badge" style={{ cursor: 'pointer' }} onClick={() => setSelectedSkills(selectedSkills.filter(x => x !== s))}>{s} ✕</span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Education</label>
        {education.map((edu, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input placeholder="Institution" value={edu.institution || ''} onChange={e => { const arr = [...education]; arr[i] = { ...arr[i], institution: e.target.value }; setEducation(arr); }} className="opportunities__search" style={{ flex: 1, minWidth: 120 }} />
            <input placeholder="Degree" value={edu.degree || ''} onChange={e => { const arr = [...education]; arr[i] = { ...arr[i], degree: e.target.value }; setEducation(arr); }} className="opportunities__search" style={{ flex: 1, minWidth: 120 }} />
            <input placeholder="Field" value={edu.field || ''} onChange={e => { const arr = [...education]; arr[i] = { ...arr[i], field: e.target.value }; setEducation(arr); }} className="opportunities__search" style={{ flex: 1, minWidth: 100 }} />
            <button onClick={() => setEducation(education.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>✕</button>
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setEducation([...education, { institution: '', degree: '', field: '' }])}>+ Add Education</Button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Work Experience</label>
        {workExperience.map((exp, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <input placeholder="Company" value={exp.company || ''} onChange={e => { const arr = [...workExperience]; arr[i] = { ...arr[i], company: e.target.value }; setWorkExperience(arr); }} className="opportunities__search" style={{ flex: 1, minWidth: 120 }} />
            <input placeholder="Role" value={exp.role || ''} onChange={e => { const arr = [...workExperience]; arr[i] = { ...arr[i], role: e.target.value }; setWorkExperience(arr); }} className="opportunities__search" style={{ flex: 1, minWidth: 120 }} />
            <button onClick={() => setWorkExperience(workExperience.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>✕</button>
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={() => setWorkExperience([...workExperience, { company: '', role: '' }])}>+ Add Experience</Button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button disabled={saving || !headline} onClick={async () => {
          setSaving(true);
          await onSave({ headline, bio, skills: selectedSkills, education, work_experience: workExperience });
          setSaving(false);
        }}>{saving ? 'Saving...' : 'Save'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function TalentForm({ initial, categories, states, onSave, onCancel, onPortfolioAdd, onPortfolioRemove }) {
  const [category, setCategory] = useState(initial?.category || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [bio, setBio] = useState(initial?.bio || '');
  const [years, setYears] = useState(initial?.years_of_experience || 0);
  const [stateId, setStateId] = useState(initial?.service_state || '');
  const [lgaId, setLgaId] = useState(initial?.service_lga || '');
  const [lgas, setLgas] = useState([]);
  const [nationwide, setNationwide] = useState(initial?.available_nationwide || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stateId) getLGAs(stateId).then(r => setLgas(r.data.data || r.data || [])).catch(() => setLgas([]));
    else setLgas([]);
  }, [stateId]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} className="opportunities__filter-select" style={{ width: '100%' }}>
          <option value="">Select category</option>
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="opportunities__search" placeholder="e.g. Freelance Photographer" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} className="opportunities__search" rows={3} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Years of Experience</label>
        <input type="number" min="0" value={years} onChange={e => setYears(parseInt(e.target.value) || 0)} className="opportunities__search" style={{ width: 100 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>State</label>
          <select value={stateId} onChange={e => { setStateId(e.target.value); setLgaId(''); }} className="opportunities__filter-select" style={{ width: '100%' }}>
            <option value="">Select state</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>LGA</label>
          <select value={lgaId} onChange={e => setLgaId(e.target.value)} className="opportunities__filter-select" style={{ width: '100%' }}>
            <option value="">All LGAs</option>
            {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={nationwide} onChange={e => setNationwide(e.target.checked)} />
        <span>Available Nationwide</span>
      </label>

      {/* Portfolio */}
      {initial && onPortfolioAdd && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
          <h4>Portfolio ({initial.portfolio_items?.length || 0}/6)</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {(initial.portfolio_items || []).map(p => (
              <div key={p.id} style={{ position: 'relative' }}>
                <img src={p.image} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                <button onClick={() => onPortfolioRemove(p.id)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
              </div>
            ))}
          </div>
          {(initial.portfolio_items?.length || 0) < 6 && (
            <input type="file" accept="image/*" onChange={e => {
              if (e.target.files[0]) {
                const fd = new FormData();
                fd.append('image', e.target.files[0]);
                fd.append('title', '');
                onPortfolioAdd(fd);
                e.target.value = '';
              }
            }} />
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button disabled={saving || !category || !title || !bio} onClick={async () => {
          setSaving(true);
          await onSave({ category, title, bio, years_of_experience: years, service_state: stateId || null, service_lga: lgaId || null, available_nationwide: nationwide });
          setSaving(false);
        }}>{saving ? 'Saving...' : 'Save'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function BusinessForm({ initial, categories, states, onSave, onCancel, onImageAdd, onImageRemove }) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [stateId, setStateId] = useState(initial?.state || '');
  const [lgaId, setLgaId] = useState(initial?.lga || '');
  const [lgas, setLgas] = useState([]);
  const [nationwide, setNationwide] = useState(initial?.operates_nationwide || false);
  const [phone, setPhone] = useState(initial?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [website, setWebsite] = useState(initial?.website || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stateId) getLGAs(stateId).then(r => setLgas(r.data.data || r.data || [])).catch(() => setLgas([]));
    else setLgas([]);
  }, [stateId]);

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: initial ? 'none' : '1px solid #e5e7eb' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="opportunities__search" placeholder="Business name" />
        </div>
        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="opportunities__filter-select" style={{ width: '100%' }}>
            <option value="">Select</option>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="opportunities__search" rows={3} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Address</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)} className="opportunities__search" rows={2} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>State</label>
          <select value={stateId} onChange={e => { setStateId(e.target.value); setLgaId(''); }} className="opportunities__filter-select" style={{ width: '100%' }}>
            <option value="">Select</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>LGA</label>
          <select value={lgaId} onChange={e => setLgaId(e.target.value)} className="opportunities__filter-select" style={{ width: '100%' }}>
            <option value="">All</option>
            {lgas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <input type="checkbox" checked={nationwide} onChange={e => setNationwide(e.target.checked)} />
        <span>Operates Nationwide</span>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div><label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="opportunities__search" /></div>
        <div><label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>WhatsApp</label><input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="opportunities__search" /></div>
        <div><label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="opportunities__search" type="email" /></div>
        <div><label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Website</label><input value={website} onChange={e => setWebsite(e.target.value)} className="opportunities__search" /></div>
      </div>

      {/* Images */}
      {initial && onImageAdd && (
        <div style={{ marginTop: 16 }}>
          <h4>Images ({initial.images?.length || 0}/8)</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {(initial.images || []).map(img => (
              <div key={img.id} style={{ position: 'relative' }}>
                <img src={img.image} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                <button onClick={() => onImageRemove(img.id)} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
              </div>
            ))}
          </div>
          {(initial.images?.length || 0) < 8 && (
            <input type="file" accept="image/*" onChange={e => {
              if (e.target.files[0]) {
                const fd = new FormData();
                fd.append('image', e.target.files[0]);
                onImageAdd(fd);
                e.target.value = '';
              }
            }} />
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button disabled={saving || !name || !category || !description} onClick={async () => {
          setSaving(true);
          await onSave({ name, category, description, address, state: stateId || null, lga: lgaId || null, operates_nationwide: nationwide, phone, whatsapp, email, website });
          setSaving(false);
        }}>{saving ? 'Saving...' : 'Save'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
