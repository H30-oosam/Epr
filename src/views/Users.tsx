import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserPlus, Search, Filter, Trash2, 
  CheckCircle2, AlertCircle, ShieldAlert, 
  Key, Shield, Settings, Sliders, Globe,
  Activity, Zap, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
}

export default function UsersView({ profile }: { profile: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const canManage = profile?.role === 'admin' || profile?.permissions?.includes('users:write');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
      setLoading(false);
    }, (err) => console.warn('Users Snapshot error:', err.message));
    return unsubscribe;
  }, []);

  const updateRole = async (uid: string, role: string) => {
    let perms = ['dashboard'];
    if (role === 'admin') perms = ['dashboard', 'hr', 'finance', 'students', 'pr', 'media', 'sales', 'customer_service', 'users'];
    else if (role === 'sales') perms = ['dashboard', 'sales', 'customer_service'];
    
    await updateDoc(doc(db, 'users', uid), { role, permissions: perms });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white arabic-font">إدارة أمن النظام والمستخدمين</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Global Permissions & Security Control</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 flex items-center gap-3">
              <Database size={16} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Node: <span className="text-white">Active</span></span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
               <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                 <ShieldAlert size={16} className="text-indigo-500" />
                 System Health
               </h4>
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Auth Latency</span>
                     <span className="text-emerald-400 text-xs font-black">24ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Active Sessions</span>
                     <span className="text-indigo-400 text-xs font-black">{users.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Security Level</span>
                     <span className="text-violet-400 text-xs font-black">WAF Active</span>
                  </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 text-white">
               <Zap size={32} className="mb-4 opacity-50" />
               <h4 className="text-lg font-black arabic-font mb-2">تأمين الوصول الموحد</h4>
               <p className="text-[10px] opacity-80 leading-relaxed font-bold">يتم تأمين جميع عمليات الدخول عبر بروتوكول OAuth 2.0 المعتمد من جوجل لضمان أعلى معايير أمن البيانات لمؤسسة رحاب.</p>
            </div>
         </div>

         <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="بحث في المستخدمين..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all border border-slate-700">
                      <Sliders size={18} />
                    </button>
                  </div>
               </div>

               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-right border-collapse text-xs">
                     <thead>
                        <tr className="bg-slate-950/50 text-slate-500 font-black uppercase tracking-tighter border-b border-slate-800">
                           <th className="p-6">المستخدم</th>
                           <th className="p-6">البريد الإلكتروني</th>
                           <th className="p-6">الدور (Role)</th>
                           <th className="p-6">الحالة</th>
                           <th className="p-6 text-left">التحكم</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/40">
                        {users.filter(u => (u.name || '').includes(search)).map(user => (
                          <tr key={user.uid} className="hover:bg-slate-800/30 transition-colors group">
                             <td className="p-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold overflow-hidden">
                                      {user.uid.startsWith('google') ? <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" width={16} /> : user.name[0]}
                                   </div>
                                   <p className="font-black text-white text-sm">{user.name}</p>
                                </div>
                             </td>
                             <td className="p-6 text-slate-500 font-bold font-mono">{user.email}</td>
                             <td className="p-6">
                                <select 
                                   value={user.role}
                                   disabled={!canManage}
                                   onChange={e => updateRole(user.uid, e.target.value)}
                                   className={`bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-black text-indigo-400 outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer uppercase tracking-widest ${!canManage && 'opacity-50 cursor-not-allowed'}`}
                                >
                                   <option value="admin">ADMIN</option>
                                   <option value="sales">SALES</option>
                                   <option value="hr">HR</option>
                                   <option value="user">USER</option>
                                </select>
                             </td>
                             <td className="p-6">
                                <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                   <span className="font-bold text-slate-400">نشط الآن</span>
                                </div>
                             </td>
                             <td className="p-6 text-left">
                                {canManage && (
                                  <button className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                     <Trash2 size={18} />
                                  </button>
                                )}
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
