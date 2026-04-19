import { useNavigate } from 'react-router-dom';

export default function AccessDenied({ requiredRole, userRole }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-[520px]">
        <div className="text-[5rem] font-black text-gold leading-none mb-2">403</div>
        <h1 className="text-[1.8rem] font-bold mb-4 text-forest">Access Denied</h1>
        <p className="text-base leading-relaxed text-gray-600 mb-3">
          This page requires <strong className="text-forest capitalize">{requiredRole?.replace(/_/g, ' ')}</strong> access.
          {userRole && <> You are logged in as <strong className="text-forest capitalize">{userRole.replace(/_/g, ' ')}</strong>.</>}
        </p>
        <p className="text-base leading-relaxed text-gray-600 mb-3">If you believe this is an error, contact your State Director or National Secretariat.</p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <button className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-none bg-forest text-white transition-all duration-200 hover:bg-forest-dark" onClick={() => navigate('/dashboard')}>Go to My Dashboard</button>
          <button className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border border-forest bg-transparent text-forest transition-all duration-200 hover:bg-black/5" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    </div>
  );
}
