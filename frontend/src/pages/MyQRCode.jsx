import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyQR } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import './MyQRCode.css';

export default function MyQRCode() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const toast = useToastStore(s => s.show);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyQR();
        const payload = res.data?.data ?? res.data;
        setData(payload);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const qrUrl = data?.qr_url;

  const copyLink = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      toast('Link copied to clipboard!', 'success');
    } catch {
      toast('Could not copy link', 'error');
    }
  };

  const downloadQR = () => {
    if (!data?.qr_image) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${data.qr_image}`;
    link.download = `cityboy-qr-${user?.full_name || 'member'}.png`;
    link.click();
    toast('QR code downloaded!', 'success');
  };

  const shareQR = async () => {
    if (navigator.share && qrUrl) {
      try {
        await navigator.share({ title: 'Join City Boy Connect', text: `Join the movement under ${user?.full_name}`, url: qrUrl });
      } catch { /* user cancelled */ }
    } else {
      await copyLink();
    }
  };

  if (loading) return <div className="qr-fullscreen"><Skeleton variant="card" /></div>;

  if (error) {
    return (
      <div className="qr-fullscreen">
        <div className="qr-card qr-error">
          <button className="qr-close" onClick={() => navigate(-1)}>✕</button>
          <h2>QR Code Unavailable</h2>
          <p className="qr-subtitle">{error}</p>
          <Button onClick={() => { setError(null); setLoading(true); getMyQR().then(r => setData(r.data?.data ?? r.data)).catch(e => setError(e.response?.data?.message || 'Failed to load QR code')).finally(() => setLoading(false)); }}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-fullscreen">
      <div className="qr-card">
        <button className="qr-close" onClick={() => navigate(-1)}>✕</button>
        <Avatar name={user?.full_name || ''} size="lg" />
        <h2>{user?.full_name}</h2>
        <p className="qr-subtitle">{user?.state_name || ''} · City Boy Movement</p>

        {data?.qr_image && (
          <div className="qr-frame">
            <img src={`data:image/png;base64,${data.qr_image}`} alt="My onboarding QR" />
          </div>
        )}

        <p className="qr-instruction">Scan to join the movement under me</p>

        <div className="qr-stats">
          <div className="qr-stat">
            <span className="qr-stat__value">{data?.direct_count ?? 0}</span>
            <span className="qr-stat__label">Direct</span>
          </div>
          <div className="qr-stat">
            <span className="qr-stat__value">{data?.network_size ?? 0}</span>
            <span className="qr-stat__label">Network</span>
          </div>
          <div className="qr-stat">
            <span className="qr-stat__value">{data?.today_count ?? 0}</span>
            <span className="qr-stat__label">Today</span>
          </div>
        </div>

        <div className="qr-actions">
          <Button variant="secondary" onClick={copyLink}>Copy Link</Button>
          <Button variant="secondary" onClick={downloadQR}>Download</Button>
          <Button onClick={shareQR}>Share</Button>
        </div>
      </div>
    </div>
  );
}
