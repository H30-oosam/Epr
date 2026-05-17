import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Search, Filter, Phone, 
  MessageCircle, UserPlus, TrendingUp, Clock, 
  CheckCircle2, AlertCircle, RefreshCcw, MoreVertical,
  Mail, MessageSquare, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: 'جديد' | 'متابعة' | 'مهتم' | 'تم التعاقد' | 'ملغي';
  lastContact: string;
  notes: string;
  interest: string;
  assignedTo: string;
}

const STATUS_COLORS: any = {
  'جديد': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'متابعة': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  'مهتم': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  'تم التعاقد': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'ملغي': 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

export default function SalesView({ profile }: { profile: any }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '', phone: '', source: 'فيسبوك', interest: 'دبلومة الويب', notes: ''
  });

  const canWrite = profile?.email === 'hossamelwardany132@gmail.com' || profile?.email === 'hossam@admin.com' || profile?.permissions?.includes('sales:write');

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('lastContact', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
      setLoading(false);
    }, (err) => console.warn('Sales Snapshot error:', err.message));
    return unsubscribe;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'leads'), {
        ...newLead,
        status: 'جديد',
        lastContact: new Date().toISOString(),
        assignedTo: 'فريق المبيعات'
      });
      setShowAddModal(false);
      setNewLead({ name: '', phone: '', source: 'فيسبوك', interest: 'دبلومة الويب', notes: '' });
    } catch (error) { console.error(error); }
  };

  const updateStatus = async (id: string, status: Lead['status']) => {
    await updateDoc(doc(db, 'leads', id), { status, lastContact: new Date().toISOString() });
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Sales Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard label="إجمالي العملاء" value={leads.length} icon={UserPlus} color="text-indigo-400" />
         <StatCard label="تم التعاقد" value={leads.filter(l => l.status === 'تم التعاقد').length} icon={CheckCircle2} color="text-emerald-400" />
         <StatCard label="قيد المتابعة" value={leads.filter(l => l.status === 'متابعة').length} icon={RefreshCcw} color="text-amber-400" />
         <StatCard label="نسبة التحويل" value={`${Math.round((leads.filter(l => l.status === 'تم التعاقد').length / (leads.length || 1)) * 100)}%`} icon={TrendingUp} color="text-violet-400" />
      </div>

      {/* CRM Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="بحث عن عميل أو رقم هاتف..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-80 font-bold"
            />
         </div>
         {canWrite && (
           <button 
             onClick={() => setShowAddModal(true)}
             className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font flex items-center gap-2"
           >
             <Plus size={18} />
             <span>إضافة Lead جديد</span>
           </button>
         )}
      </div>

      {/* Leads List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {leads.filter(l => (l.name || '').includes(search) || (l.phone || '').includes(search)).map(lead => (
            <motion.div 
               layout
               key={lead.id}
               className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all group"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[lead.status]}`}>
                     {lead.status}
                  </div>
                  <button className="text-slate-600 hover:text-white transition-colors"><MoreVertical size={18} /></button>
               </div>

               <h4 className="text-lg font-black text-white arabic-font mb-1">{lead.name}</h4>
               <p className="text-xs text-slate-500 font-bold font-mono tracking-tighter mb-4">{lead.phone}</p>

               <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                     <ShoppingCart size={14} className="text-indigo-500" />
                     <span>الاهتمام: {lead.interest}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                     <Clock size={14} className="text-indigo-500" />
                     <span>آخر تواصل: {new Date(lead.lastContact).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                     <Send size={14} className="text-indigo-500" />
                     <span>المصدر: {lead.source}</span>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => openWhatsApp(lead.phone)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-500/10"
                  >
                     <MessageCircle size={18} />
                     <span className="text-[8px] font-black uppercase">WhatsApp</span>
                  </button>
                  <button className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/10">
                     <Phone size={18} />
                     <span className="text-[8px] font-black uppercase">Call</span>
                  </button>
                  <button className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700">
                     <Clock size={18} />
                     <span className="text-[8px] font-black uppercase">Follow-up</span>
                  </button>
               </div>
               
               <div className="mt-4 pt-4 border-t border-slate-800 flex gap-1">
                  {['جديد', 'متابعة', 'مهتم', 'تم التعاقد'].filter(s => s !== lead.status).map(s => (
                    <button 
                      key={s}
                      onClick={() => updateStatus(lead.id, s as any)}
                      className="text-[8px] font-black px-2 py-1 bg-slate-950 text-slate-500 rounded-lg hover:text-indigo-400 transition-all border border-slate-900"
                    >
                      {s.split(' ')[0]}
                    </button>
                  ))}
               </div>
            </motion.div>
         ))}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl"
            >
               <h3 className="text-2xl font-black text-white arabic-font mb-6 leading-none">إضافة صفقة محتملة جديدة</h3>
               <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">اسم العميل</label>
                    <input 
                      type="text" 
                      required
                      value={newLead.name}
                      onChange={e => setNewLead({...newLead, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">رقم الجوال</label>
                      <input 
                        type="text" 
                        required
                        value={newLead.phone}
                        onChange={e => setNewLead({...newLead, phone: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                        placeholder="01xxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">مصدر العميل</label>
                      <select 
                         value={newLead.source}
                         onChange={e => setNewLead({...newLead, source: e.target.value})}
                         className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 font-bold"
                      >
                         <option value="فيسبوك">فيسبوك</option>
                         <option value="تيك توك">تيك توك</option>
                         <option value="إنستجرام">إنستجرام</option>
                         <option value="اتصال مباشر">اتصال مباشر</option>
                         <option value="توصية">توصية</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">البرنامج المهتم به</label>
                    <input 
                       type="text" 
                       value={newLead.interest}
                       onChange={e => setNewLead({...newLead, interest: e.target.value})}
                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                       placeholder="مثال: دبلومة البرمجة"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">ملاحظات أولية</label>
                    <textarea 
                       value={newLead.notes}
                       onChange={e => setNewLead({...newLead, notes: e.target.value})}
                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold h-20"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font">بدء المتابعة</button>
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
