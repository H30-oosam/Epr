import React, { useState, useEffect } from 'react';
import { 
  CreditCard, TrendingUp, TrendingDown, Plus, 
  DollarSign, Wallet, Calendar, Search, Filter, 
  ArrowUpRight, ArrowDownRight, FileText, Download,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, orderBy } from 'firebase/firestore';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  method: string;
}

export default function FinanceView({ profile }: { profile: any }) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTxn, setNewTxn] = useState({
    description: '', amount: 0, type: 'income' as const, category: 'عام', method: 'خزينة رئيسية'
  });

  const canWrite = profile?.email === 'hossamelwardany132@gmail.com' || profile?.permissions?.includes('finance:write');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTxns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    }, (err) => console.warn('Finance Snapshot error:', err.message));
    return unsubscribe;
  }, []);

  const totals = txns.reduce((acc, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'transactions'), {
        ...newTxn,
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      setNewTxn({ description: '', amount: 0, type: 'income', category: 'عام', method: 'خزينة رئيسية' });
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-emerald-600/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <TrendingUp size={32} />
              </div>
              <ArrowUpRight className="text-emerald-500 opacity-20" size={40} />
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">إجمالي الإيرادات</p>
            <h4 className="text-3xl font-black text-white">{totals.income.toLocaleString()} <span className="text-sm font-bold text-slate-500">EGP</span></h4>
         </motion.div>

         <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-rose-600/10 text-rose-400 rounded-2xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                <TrendingDown size={32} />
              </div>
              <ArrowDownRight className="text-rose-500 opacity-20" size={40} />
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">إجمالي المصروفات</p>
            <h4 className="text-3xl font-black text-white">{totals.expense.toLocaleString()} <span className="text-sm font-bold text-slate-500">EGP</span></h4>
         </motion.div>

         <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 text-white group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Wallet size={32} />
              </div>
              <CheckCircle2 className="text-white opacity-40" size={40} />
            </div>
            <p className="text-xs font-black text-indigo-100 uppercase tracking-widest mb-1">صافي الكاش (السيولة)</p>
            <h4 className="text-3xl font-black">{(totals.income - totals.expense).toLocaleString()} <span className="text-sm font-bold opacity-60">EGP</span></h4>
         </motion.div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
         <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-black text-white arabic-font">سجل المعاملات اليومي</h4>
              <p className="text-xs text-slate-500 font-medium">متابعة دقيقة لكل التدفقات المالية لشركة رحاب</p>
            </div>
            <div className="flex gap-2">
               {canWrite && (
                 <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font">
                   <Plus size={18} />
                   <span>إضافة سند</span>
                 </button>
               )}
               <button className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all border border-slate-700">
                 <Download size={18} />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right border-collapse text-xs">
               <thead>
                 <tr className="bg-slate-950/50 text-slate-500 font-black uppercase tracking-tighter border-b border-slate-800">
                   <th className="p-6">البيان والتفاصيل</th>
                   <th className="p-6">التصنيف</th>
                   <th className="p-6">طريقة الدفع</th>
                   <th className="p-6">التاريخ</th>
                   <th className="p-6 text-left">المبلغ</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/40">
                 {txns.map(txn => (
                   <tr key={txn.id} className="hover:bg-slate-800/30 transition-colors group">
                     <td className="p-6">
                        <div className="flex items-center gap-4">
                           <div className={`p-2 rounded-lg ${txn.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                             {txn.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                           </div>
                           <p className="font-black text-white text-sm">{txn.description}</p>
                        </div>
                     </td>
                     <td className="p-6">
                        <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-tight">{txn.category}</span>
                     </td>
                     <td className="p-6 text-slate-400 font-medium">{txn.method}</td>
                     <td className="p-6 text-slate-500 font-bold">{txn.date}</td>
                     <td className={`p-6 text-left font-black text-sm ${txn.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {txn.type === 'income' ? '+' : '-'}{txn.amount.toLocaleString()} EGP
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl"
            >
               <h3 className="text-2xl font-black text-white arabic-font mb-6">تسجيل حركة مالية</h3>
               <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">بيان المعاملة</label>
                    <input 
                      type="text" 
                      required
                      value={newTxn.description}
                      onChange={e => setNewTxn({...newTxn, description: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">نوع الحركة</label>
                      <select 
                        value={newTxn.type}
                        onChange={e => setNewTxn({...newTxn, type: e.target.value as any})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 font-bold"
                      >
                        <option value="income">📈 إيراد</option>
                        <option value="expense">📉 مصروف</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">القيمة (EGP)</label>
                      <input 
                        type="number" 
                        required
                        value={newTxn.amount}
                        onChange={e => setNewTxn({...newTxn, amount: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">التصنيف</label>
                      <select 
                        value={newTxn.category}
                        onChange={e => setNewTxn({...newTxn, category: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 font-bold"
                      >
                        <option value="اشتراك طلاب">اشتراك طلاب</option>
                        <option value="رواتب">رواتب</option>
                        <option value="ميديا">ميديا وإعلانات</option>
                        <option value="إيجار وتكاليف">إيجار وتكاليف</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">طريقة الدفع</label>
                      <select 
                        value={newTxn.method}
                        onChange={e => setNewTxn({...newTxn, method: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 font-bold"
                      >
                        <option value="خزينة رئيسية">خزينة رئيسية</option>
                        <option value="فودافون كاش">فودافون كاش</option>
                        <option value="تحويل بنكي">تحويل بنكي</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font">حفظ السند</button>
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
