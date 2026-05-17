import React, { useState, useEffect } from 'react';
import { 
  Headset, MessageSquare, Plus, Search, Filter, 
  CheckCircle2, Clock, AlertCircle, Phone, 
  MessageCircle, Star, MoreVertical, Send, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, orderBy } from 'firebase/firestore';

interface Ticket {
  id: string;
  name: string;
  phone: string;
  issue: string;
  status: 'نشط' | 'قيد المراجعة' | 'مغلق';
  priority: 'عالي' | 'متوسط' | 'عادي';
  date: string;
}

const PRIORITY_COLORS: any = {
  'عالي': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  'متوسط': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'عادي': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
};

export default function CustomerServiceView({ profile }: { profile: any }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: '', phone: '', issue: '', priority: 'متوسط' as const
  });

  const canWrite = profile?.email === 'hossamelwardany132@gmail.com' || profile?.permissions?.includes('customer_service:write');

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
      setLoading(false);
    }, (err) => console.warn('CustomerService Snapshot error:', err.message));
    return unsubscribe;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tickets'), {
        ...newTicket,
        status: 'نشط',
        date: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewTicket({ name: '', phone: '', issue: '', priority: 'متوسط' });
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      {/* Support Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white arabic-font">نظام تذاكر الدعم والعملاء</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Customer Success & Support</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="بحث في التذاكر..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
              />
           </div>
           {canWrite && (
             <button 
               onClick={() => setShowAddModal(true)}
               className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font flex items-center gap-2"
             >
               <Plus size={18} />
               <span>فتح تذكرة</span>
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard label="تذاكر نشطة" value={tickets.filter(t => t.status === 'نشط').length} icon={AlertCircle} color="text-indigo-400" />
         <StatCard label="تم الحل اليوم" value={tickets.filter(t => t.status === 'مغلق').length} icon={CheckCircle2} color="text-emerald-400" />
         <StatCard label="زمن الاستجابة" value="12 دقيقة" icon={Clock} color="text-amber-400" />
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {tickets.filter(t => (t.name || '').includes(search)).map(ticket => (
            <motion.div 
               layout
               key={ticket.id}
               className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all flex flex-col h-full"
            >
               <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${PRIORITY_COLORS[ticket.priority]}`}>
                    Priority: {ticket.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ticket.status === 'نشط' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`}></span>
                    <span className="text-[10px] text-slate-500 font-bold">{ticket.status}</span>
                  </div>
               </div>

               <h4 className="text-lg font-black text-white arabic-font mb-2 leading-tight flex-1">{ticket.issue}</h4>
               
               <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-900 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-indigo-400">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white arabic-font">{ticket.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">{ticket.phone}</p>
                  </div>
               </div>

               <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all border border-slate-700">تحويل لواتساب</button>
                  <button className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10">
                    <CheckCircle2 size={18} />
                  </button>
               </div>
            </motion.div>
         ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl"
            >
               <h3 className="text-2xl font-black text-white arabic-font mb-6 leading-none">فتح تذكرة دعم عملاء</h3>
               <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">اسم العميل</label>
                    <input 
                      type="text" 
                      required
                      value={newTicket.name}
                      onChange={e => setNewTicket({...newTicket, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">رقم الجوال للربط</label>
                    <input 
                      type="text" 
                      required
                      value={newTicket.phone}
                      onChange={e => setNewTicket({...newTicket, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">وصف المشكلة / الاستفسار</label>
                    <textarea 
                      required
                      value={newTicket.issue}
                      onChange={e => setNewTicket({...newTicket, issue: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الأولوية</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['عالي', 'متوسط', 'عادي'].map((p: any) => (
                         <button
                           key={p}
                           type="button"
                           onClick={() => setNewTicket({...newTicket, priority: p})}
                           className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                             newTicket.priority === p 
                               ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20' 
                               : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                           }`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font">إطلاق التذكرة</button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black border border-slate-700 arabic-font">إلغاء</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center gap-4">
       <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 ${color}`}>
         <Icon size={24} />
       </div>
       <div>
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
         <h4 className="text-2xl font-black text-white">{value}</h4>
       </div>
    </div>
  );
}
