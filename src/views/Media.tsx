import React, { useState } from 'react';
import { 
  Film, Play, Plus, Clock, CheckCircle2, 
  AlertCircle, Camera, Mic, Layout, Search,
  Filter, MoreHorizontal, Image as ImageIcon,
  Video, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PROJECTS = [
  { id: 1, title: 'بودكاست التعليم الحديث - حلقة 5', type: 'Podcasting', status: 'In Production', progress: 65, team: 'Production Team A' },
  { id: 2, title: 'فيديو ترويجي لشركة رحاب', type: 'Promo Video', status: 'Editing', progress: 85, team: 'Post-Prod Team' },
  { id: 3, title: 'جلسة تصوير الموظفين', type: 'Photography', status: 'Scheduled', progress: 10, team: 'Studio B' },
  { id: 4, title: 'تصميم الهوية البصرية الجديدة', type: 'Design', status: 'Completed', progress: 100, team: 'Creative Team' },
];

export default function MediaView({ profile }: { profile: any }) {
  const canWrite = profile?.email === 'hossamelwardany132@gmail.com' || profile?.email === 'hossam@admin.com' || profile?.permissions?.includes('media:write');
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white arabic-font">إدارة الإنتاج والميديا</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Production & Creative Studio</p>
        </div>
        {canWrite && (
          <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font flex items-center gap-2">
             <Plus size={18} />
             <span>بدء مشروع إبداعي</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard label="مشاريع تحت التنفيذ" value="12" icon={Clock} color="text-amber-400" />
         <StatCard label="ساعات التصوير" value="145" icon={Camera} color="text-indigo-400" />
         <StatCard label="مشاريع مكتملة" value="284" icon={CheckCircle2} color="text-emerald-400" />
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden">
         <div className="p-8 border-b border-slate-800 flex justify-between items-center">
            <h4 className="text-lg font-black text-white arabic-font">خط الإنتاج الحالي</h4>
            <div className="flex gap-2">
               <button className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all border border-slate-700">
                 <Filter size={18} />
               </button>
            </div>
         </div>
         
         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECTS.map(proj => (
              <div key={proj.id} className="bg-slate-950 border border-slate-900 p-6 rounded-3xl hover:border-indigo-500/30 transition-all group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-indigo-400">
                          {proj.type === 'Podcasting' ? <Mic size={20} /> : <Video size={20} />}
                       </div>
                       <div>
                          <h5 className="font-black text-white text-sm">{proj.title}</h5>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{proj.type}</span>
                       </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${
                      proj.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                       {proj.status}
                    </span>
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-1">
                       <span>Progress</span>
                       <span>{proj.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${proj.progress}%` }}
                         className={`h-full rounded-full ${proj.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                       />
                    </div>
                 </div>

                 <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <div className="flex items-center gap-2">
                       <Users size={12} />
                       <span>{proj.team}</span>
                    </div>
                    <button className="text-indigo-400 hover:text-indigo-300 transition-colors">عرض التفاصيل</button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
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
