import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyQR } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

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
  const shareUrl = data?.share_url || qrUrl;

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
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
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({ title: 'Join City Boy Connect', text: `Join the movement under ${user?.full_name}`, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      await copyLink();
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[80vh] px-4 py-8"><Skeleton variant="card" /></div>;

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] px-4 py-8">
        <div className="bg-white rounded-3xl px-8 py-10 text-center max-w-[400px] w-full relative shadow-elevated flex flex-col items-center gap-4">
          <button className="absolute top-4 right-4 bg-transparent border-none text-xl cursor-pointer text-gray-500" onClick={() => navigate(-1)}>✕</button>
          <h2>QR Code Unavailable</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Button onClick={() => { setError(null); setLoading(true); getMyQR().then(r => setData(r.data?.data ?? r.data)).catch(e => setError(e.response?.data?.message || 'Failed to load QR code')).finally(() => setLoading(false)); }}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 py-8">
      <div className="bg-white rounded-3xl px-8 py-10 text-center max-w-[400px] w-full relative shadow-elevated">
        <button className="absolute top-4 right-4 bg-transparent border-none text-xl cursor-pointer text-gray-500" onClick={() => navigate(-1)}>✕</button>
        <Avatar name={user?.full_name || ''} size="lg" />
        <h2 className="mt-3 mb-1 font-display">{user?.full_name}</h2>
        <p className="text-gray-500 text-sm mb-6">{user?.state_name || ''} · City Boy Movement</p>

        {data?.qr_image && (
          <div className="bg-white rounded-2xl p-6 inline-block shadow-card">
            <img className="w-[200px] h-[200px] block" src={`data:image/png;base64,${data.qr_image}`} alt="My onboarding QR" />
          </div>
        )}

        <p className="text-gray-500 text-[0.8rem] my-4">Scan to join the movement under me</p>

        <div className="flex justify-center gap-8 my-6">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-forest">{data?.direct_count ?? 0}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Direct</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-forest">{data?.network_size ?? 0}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Network</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-forest">{data?.today_count ?? 0}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Today</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="secondary" onClick={copyLink}>Copy Link</Button>
          <Button variant="secondary" onClick={downloadQR}>Download</Button>
          <Button onClick={shareQR}>Share</Button>
        </div>
      </div>
    </div>
  );
}
