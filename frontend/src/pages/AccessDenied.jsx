import { useNavigate } from 'react-router-dom';
import './ErrorPages.css';

export default function AccessDenied({ requiredRole, userRole }) {
  const navigate = useNavigate();
  return (
    <div className="error-page">
      <div className="error-page__inner">
        <div className="error-page__code">403</div>
        <h1 className="error-page__title">Access Denied</h1>
        <p className="error-page__text">
          This page requires <strong>{requiredRole?.replace(/_/g, ' ')}</strong> access.
          {userRole && <> You are logged in as <strong>{userRole.replace(/_/g, ' ')}</strong>.</>}
        </p>
        <p className="error-page__text">If you believe this is an error, contact your State Director or National Secretariat.</p>
        <div className="error-page__actions">
          <button className="error-page__btn error-page__btn--primary" onClick={() => navigate('/dashboard')}>Go to My Dashboard</button>
          <button className="error-page__btn error-page__btn--ghost" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    </div>
  );
}
