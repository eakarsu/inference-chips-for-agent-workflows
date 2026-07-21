import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Cpu, GitBranch, LogOut, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const navigate=useNavigate(); const user=JSON.parse(localStorage.getItem('user')||'{}');
  const logout=()=>{localStorage.removeItem('token');localStorage.removeItem('user');navigate('/login');};
  return <div className="flex h-screen bg-gray-950"><aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
    <div className="p-5 border-b border-gray-800 flex gap-3 items-center"><div className="w-9 h-9 rounded-lg bg-cyan-900 border border-cyan-700 flex items-center justify-center"><Cpu className="w-5 h-5 text-cyan-400" /></div><div><div className="text-white font-bold text-sm">ChipProfiler</div><div className="text-cyan-500 text-xs">Governed Releases</div></div></div>
    <nav className="flex-1 p-3"><p className="text-xs text-gray-600 px-3 pb-2 uppercase tracking-wider">Supported journey</p><NavLink to="/deployments" className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive?'bg-cyan-600 text-white':'text-gray-400 hover:bg-gray-800 hover:text-white'}`}><GitBranch className="w-4 h-4" />Release &amp; canary control</NavLink><div className="mt-4 p-3 rounded-lg border border-emerald-900 bg-emerald-950/30 text-xs text-emerald-300"><ShieldCheck className="w-4 h-4 mb-2" />Authoritative profiles, measured placement, canary SLOs, and rollback evidence are retained.</div></nav>
    <div className="p-3 border-t border-gray-800 flex items-center justify-between"><div><div className="text-white text-xs">{user.name}</div><div className="text-gray-500 text-xs">{user.role}</div></div><button aria-label="Log out" onClick={logout}><LogOut className="w-4 h-4 text-gray-500 hover:text-red-400" /></button></div>
  </aside><main className="flex-1 overflow-auto"><Outlet /></main></div>;
}
