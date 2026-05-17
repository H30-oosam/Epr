import React, { useState } from 'react';
import { 
  Megaphone, Plus, Calendar, MapPin, 
  Users, Globe, Heart, Award, Search, 
  Filter, MoreHorizontal, MessageCircle, Star 
} from 'lucide-react';
import { motion } from 'motion/react';

const EVENTS = [
  { id: 1, title: 'احتفالية تكريم الموظفين السنوية', date: '2024-05-20', attendees: 120, status: 'Upcoming', category: 'Internal' },
  { id: 2, title: 'ندوة مستقبل الذكاء الاصطناعي', date: '2024-06-15', attendees: 450, status: 'Draft', category: 'Workshop' },
  { id: 3, title: 'حفل تخرج الدفعة العاشرة', date: '2024-04-10', attendees: 300, status: 'Completed', category: 'Ceremony' },
];

export default function PRView({ profile }: { profile: any }) {
  const canWrite = profile?.email === 'hossamelwardany132@gmail.com' || profile?.email === 'hossam@admin.com' || profile?.permissions?.includes('pr:write');
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white arabic-font">العلاقات العامة والفعاليات</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Public Relations & Events</p>
        </div>
        {canWrite && (
          <button className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font flex items-center gap-2">
             <Plus size={18} />
             <span>تنظيم فعالية جديدة</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400">
                <Star size={24} />
              </div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Brand Rating</span>
            </div>
            <h4 className="text-3xl font-black text-white tracking-tight">4.9 / 5.0</h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-indigo-500 text-indigo-500" />)}
            </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col gap-4">
           <div className="p-3 rounded-2xl bg-rose-600/10 text-rose-400 w-fit">
             <Heart size={24} />
           </div>
           <div>
             <h4 className="text-3xl font-black text-white tracking-tight">1.2M</h4>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Social Reach & Identity</p>
           </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col gap-4">
           <div className="p-3 rounded-2xl bg-emerald-600/10 text-emerald-400 w-fit">
             <Globe size={24} />
           </div>
           <div>
             <h4 className="text-3xl font-black text-white tracking-tight">24</h4>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Partnerships & MoUs</p>
           </div>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden">
         <div className="p-8 border-b border-slate-800">
            <h4 className="text-lg font-black text-white arabic-font">الأجندة والفعاليات الجارية</h4>
         </div>
         
         <div className="p-6 space-y-4">
            {EVENTS.map(event => (
              <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-950 border border-slate-900 rounded-3xl hover:border-indigo-500/20 transition-all group">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-white">
                       <span className="text-lg font-black">{event.date.split('-')[2]}</span>
                       <span className="text-[8px] font-black text-slate-500 uppercase">{event.date.split('-')[1]} MAR</span>
                    </div>
                    <div>
                       <h5 className="text-lg font-black text-white arabic-font mb-1">{event.title}</h5>
                       <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
                          <span className="flex items-center gap-1.5"><Users size={12} className="text-indigo-500" /> {event.attendees} حضور</span>
                          <span className="flex items-center gap-1.5"><MapPin size={12} className="text-indigo-500" /> مقر الشركة الرئيسي</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-400 uppercase tracking-tighter">{event.category}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <button className="px-6 py-2.5 bg-slate-900 text-slate-400 text-[10px] font-black uppercase rounded-xl border border-slate-800 hover:bg-slate-800 transition-all">تعديل الأجندة</button>
                    <button className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                       <MessageCircle size={18} />
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
