import { useAuthStore } from '../store/authStore';

export default function SuspendedAccount() {
  const { logout } = useAuthStore();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
      <div className="text-center max-w-[520px] text-white">
        <div className="text-[4rem] mb-4">🚫</div>
        <h1 className="text-[1.8rem] font-bold mb-4 text-red-500">Account Suspended</h1>
        <p className="text-base leading-relaxed text-gray-300 mb-3">
          Your account has been suspended. This means you cannot access City Boy Connect
          until the suspension is lifted by an administrator.
        </p>
        <div className="bg-white/[0.08] border border-white/15 rounded-xl p-5 my-6 text-left text-sm text-gray-300">
          <p><strong className="text-white">To appeal this decision, contact:</strong></p>
          <p>National Secretariat: Officeofdgcityboymovement@gmail.com</p>
          <p>Phone: 09077776773 or 08037143337</p>
        </div>
        <button className="px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border border-white/30 bg-transparent text-gray-300 transition-all duration-200 hover:bg-black/5" onClick={logout}>Sign Out</button>
      </div>
    </div>
  );
}
