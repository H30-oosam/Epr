import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Award, CheckCircle2, ShieldCheck, Calendar, User, BookOpen, ExternalLink, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function VerifyCertificateView() {
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const certId = window.location.pathname.split('/').pop();

  useEffect(() => {
    async function fetchCert() {
      if (!certId || certId === 'verify') {
        setError('رقم الشهادة غير صالح');
        setLoading(false);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, 'issued_certificates', certId));
        if (docSnap.exists()) {
          setCert(docSnap.data());
        } else {
          setError('لم يتم العثور على الشهادة المطلوبة في سجلاتنا الرسمية');
        }
      } catch (err) {
        setError('حدث خطأ أثناء التحقق من الشهادة');
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [certId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
             <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-white arabic-font mb-4">فشل التحقق</h2>
          <p className="text-slate-400 arabic-font font-bold mb-8">{error}</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition-all">
             العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden relative z-10"
      >
        <div className="bg-emerald-500 text-white p-8 text-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <Award size={200} className="absolute -right-10 -top-10 rotate-12" />
           </div>
           <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-md">
                 <CheckCircle2 size={32} />
              </div>
              <h1 className="text-3xl font-black arabic-font tracking-tight mb-2">شهادة رسمية معتمدة</h1>
              <p className="text-emerald-100 font-bold arabic-font opacity-80">تم التحقق بنجاح من صحة هذه الشهادة وصلاحيتها</p>
           </div>
        </div>

        <div className="p-10 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/50">
                 <div className="flex items-center gap-3 text-slate-500 mb-3 uppercase text-[10px] font-black tracking-widest">
                    <User size={14} className="text-indigo-400" />
                    اسم الخريج
                 </div>
                 <p className="text-xl font-black text-white arabic-font">{cert.studentName}</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/50">
                 <div className="flex items-center gap-3 text-slate-500 mb-3 uppercase text-[10px] font-black tracking-widest">
                    <BookOpen size={14} className="text-indigo-400" />
                    البرنامج التدريبي
                 </div>
                 <p className="text-xl font-black text-white arabic-font">{cert.course}</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/50">
                 <div className="flex items-center gap-3 text-slate-500 mb-3 uppercase text-[10px] font-black tracking-widest">
                    <Award size={14} className="text-indigo-400" />
                    التقدير العام
                 </div>
                 <p className="text-xl font-black text-emerald-400">({cert.grade})</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800/50">
                 <div className="flex items-center gap-3 text-slate-500 mb-3 uppercase text-[10px] font-black tracking-widest">
                    <Calendar size={14} className="text-indigo-400" />
                    تاريخ الإصدار
                 </div>
                 <p className="text-xl font-black text-white">{cert.issuedAt?.toDate().toLocaleDateString('ar-EG')}</p>
              </div>
           </div>

           <div className="pt-8 border-t border-slate-800">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                       <GraduationCap size={24} />
                    </div>
                    <div>
                       <p className="text-xs font-black text-white arabic-font">أكاديمية رحاب للحلول الرقمية</p>
                       <p className="text-[10px] font-black text-slate-500 uppercase">Official Verification Node</p>
                    </div>
                 </div>
                 <p className="text-[10px] font-black text-slate-500 font-mono">HASH: {certId?.substring(0, 16)}</p>
              </div>
           </div>
        </div>

        <div className="bg-slate-950 border-t border-slate-800 p-6 flex items-center justify-center">
           <button className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10 uppercase font-mono">
              <ExternalLink size={16} />
              Accredited by Rahab Group
           </button>
        </div>
      </motion.div>
    </div>
  );
}
