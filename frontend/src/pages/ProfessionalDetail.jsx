import './Opportunities.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOpportunityProfile } from '../api/client';
import Skeleton from '../components/Skeleton';
import Button from '../components/Button';
import Card from '../components/Card';

export default function ProfessionalDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getOpportunityProfile(userId);
        const data = res.data.data || res.data;
        setProfile(data.professional_profile || data);
      } catch { /* ok */ }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <div style={{ padding: '2rem' }}><Skeleton variant="card" /><Skeleton variant="text" width="60%" /></div>;
  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Profile not found</h2><Button onClick={() => navigate(-1)}>Go Back</Button></div>;

  const user = profile.user || {};
  const education = profile.education || [];
  const experience = profile.work_experience || [];

  return (
    <div className="opportunities" style={{ maxWidth: 800 }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', marginBottom: 'var(--space-md)' }}>← Back to Search</button>
      <Card padding="lg">
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {user.profile_photo ? (
            <img src={user.profile_photo} alt="" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>💼</div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0 }}>{user.full_name}</h1>
            <p style={{ color: '#6b7280', margin: '4px 0', fontSize: '1.1rem' }}>{profile.headline}</p>
            {user.state_name && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>📍 {user.state_name}</p>}
          </div>
        </div>
      </Card>

      {(profile.skills || []).length > 0 && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Skills</h3>
          <div className="opportunity-card__badges">
            {profile.skills.map(s => (
              <span key={s.id || s} className="opportunity-card__badge">{s.name || s}</span>
            ))}
          </div>
        </Card>
      )}

      {experience.length > 0 && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Work Experience</h3>
          {experience.map((exp, i) => (
            <div key={i} style={{ borderLeft: '2px solid var(--color-primary)', paddingLeft: 16, marginBottom: 16 }}>
              <strong>{exp.role || exp.title}</strong>
              <p style={{ color: '#6b7280', margin: '2px 0', fontSize: '0.9rem' }}>{exp.company}</p>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                {exp.start_date || exp.start_year}{exp.is_current ? ' — Present' : exp.end_date || exp.end_year ? ` — ${exp.end_date || exp.end_year}` : ''}
              </p>
              {exp.description && <p style={{ color: '#374151', fontSize: '0.9rem', marginTop: 4 }}>{exp.description}</p>}
            </div>
          ))}
        </Card>
      )}

      {education.length > 0 && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>Education</h3>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <strong>{edu.institution}</strong>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '2px 0' }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{edu.start_year}{edu.end_year ? ` — ${edu.end_year}` : ''}</p>
            </div>
          ))}
        </Card>
      )}

      {profile.bio && (
        <Card padding="md" style={{ marginTop: 'var(--space-md)' }}>
          <h3>About</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{profile.bio}</p>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
        {profile.cv_url && (
          <Button onClick={() => window.open(profile.cv_url, '_blank')}>📄 Download CV</Button>
        )}
      </div>
    </div>
  );
}
