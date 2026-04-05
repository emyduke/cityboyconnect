import { useAuthStore } from '../store/authStore';
import './ErrorPages.css';

export default function SuspendedAccount() {
  const { logout } = useAuthStore();
  return (
    <div className="error-page error-page--suspended">
      <div className="error-page__inner">
        <div className="error-page__icon">🚫</div>
        <h1 className="error-page__title">Account Suspended</h1>
        <p className="error-page__text">
          Your account has been suspended. This means you cannot access City Boy Connect
          until the suspension is lifted by an administrator.
        </p>
        <div className="error-page__contact">
          <p><strong>To appeal this decision, contact:</strong></p>
          <p>National Secretariat: Officeofdgcityboymovement@gmail.com</p>
          <p>Phone: 09077776773 or 08037143337</p>
        </div>
        <button className="error-page__btn error-page__btn--ghost" onClick={logout}>Sign Out</button>
      </div>
    </div>
  );
}
