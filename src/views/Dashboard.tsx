import React, { useState, useEffect } from 'react';
import { 
  Users, CreditCard, GraduationCap, ShoppingCart, 
  Sparkles, TrendingUp, CheckCircle2, ClipboardList, Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function DashboardView({ profile }: { profile: any }) {
  const [stats, setStats] = useState({ employees: 0, attendance: 0, tasks: 0, leaves: 0 });

  const hasAccess = (module: string) => {
    return profile?.email === 'hossamelwardany132@gmail.com' || profile?.email === 'hossam@admin.com' || profile?.permissions?.includes(`${module}:read`) || profile?.permissions?.includes(module);
  };

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    if (hasAccess('hr')) {
      unsubs.push(onSnapshot(collection(db, 'employees'), s => setStats(prev => ({...prev, employees: s.size})), (err) => console.warn('Dashboard [employees]:', err.message)));
      unsubs.push(onSnapshot(collection(db, 'attendance'), s => {
        const today = new Date().toISOString().split('T')[0];
        const presentToday = s.docs.filter(d => d.data().date === today).length;
        setStats(prev => ({...prev, attendance: presentToday}));
      }, (err) => console.warn('Dashboard [attendance]:', err.message)));
      unsubs.push(onSnapshot(collection(db, 'leaves'), s => {
        const pending = s.docs.filter(d => d.data().status === 'قيد الانتظار').length;
        setStats(prev => ({...prev, leaves: pending}));
      }, (err) => console.warn('Dashboard [leaves]:', err.message)));
    }
    
    unsubs.push(onSnapshot(collection(db, 'tasks'), s => {
      const open = s.docs.filter(d => d.data().status !== 'Completed').length;
      setStats(prev => ({...prev, tasks: open}));
    }, (err) => console.warn('Dashboard [tasks]:', err.message)));

    return () => unsubs.forEach(u => u());
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hasAccess('hr') && <StatCard label="الموظفون" value={stats.employees} trend="+2" icon={Users} color="text-indigo-400" />}
        {hasAccess('hr') && <StatCard label="الحضور اليوم" value={stats.attendance} trend="نشط" icon={CheckCircle2} color="text-emerald-400" />}
        <StatCard label="المهام المفتوحة" value={stats.tasks} trend="قيد المتابعة" icon={ClipboardList} color="text-amber-400" />
        {hasAccess('hr') && <StatCard label="طلبات الإجازة" value={stats.leaves} trend="معلق" icon={Calendar} color="text-rose-400" />}
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-10 rounded-[2.5rem] border border-indigo-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
          <Sparkles size={240} />
        </div>
        <div className="relative z-10 space-y-4 max-w-2xl text-right">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 font-mono">
            Enterprise Management v2.0
          </span>
          <h2 className="text-4xl font-black text-white arabic-font leading-tight">بوابة رحاب لإدارة الموارد السحابية</h2>
          <p className="text-slate-400 leading-relaxed font-bold text-sm arabic-font">
            نظام متكامل يربط بين جميع فروع وأقسام المؤسسة بذكاء اصطناعي مدمج لتحليل البيانات.
          </p>
          <div className="flex gap-4 pt-4 justify-end">
             <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/30 arabic-font">بدء التحليل</button>
            <button className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black border border-slate-700 arabic-font">التقارير</button>
          </div>
        </div>
      </div>
      
      {/* Activity Feed Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
           <h3 className="text-xl font-bold mb-6 text-white arabic-font">أحدث النشاطات</h3>
           <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-4 bg-slate-950 rounded-3xl border border-slate-900">
                  <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">عملية تشغيلية ناجحة</h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">منذ دقائق</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
           <h3 className="text-xl font-bold mb-6 text-white arabic-font">المهام الجارية</h3>
           <div className="space-y-4">
              {[
                { t: 'مراجعة عقود الميديا الجديدة', c: true },
                { t: 'اعتماد مسير رواتب موظفي القاهرة', c: false },
                { t: 'تطوير قوالب الشهادات الذكية', c: false },
                { t: 'متابعة الصفقات المتأخرة في CRM', c: false },
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-950 rounded-3xl border border-slate-900">
                  <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center ${task.c ? 'bg-indigo-600 border-indigo-600' : 'border-slate-800'}`}>
                    {task.c && <CheckCircle2 className="text-white" size={14} />}
                  </div>
                  <span className={`text-sm font-bold ${task.c ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.t}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 group-hover:bg-slate-800 transition-all ${color}`}>
          <Icon size={24} />
        </div>
        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded-lg">{trend}</span>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-black text-white tracking-tight">{value}</h4>
      </div>
    </div>
  );
}
