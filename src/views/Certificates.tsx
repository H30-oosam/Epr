import React, { useState, useEffect } from 'react';
import { 
  Award, Search, Printer, Download, QrCode, 
  FileCheck, Users, GraduationCap, Filter,
  ExternalLink, CheckCircle2, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, 
  Timestamp, where, orderBy, getDocs 
} from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  course: string;
  progress: number;
  grade: string;
  completionDate?: string;
  certificateId?: string;
}

interface CertificateTemplate {
  id: string;
  title: string;
  lecturer: string;
  specialization: string;
}

export default function CertificatesView({ profile }: { profile: any }) {
  const [graduates, setGraduates] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGrad, setSelectedGrad] = useState<Student | null>(null);

  const canWrite = profile?.role === 'admin' || profile?.email === 'hossam@admin.com';

  useEffect(() => {
    // Only fetch students who reached 100% progress
    const q = query(collection(db, 'students'), where('progress', '==', 100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setGraduates(data);
      if (data.length > 0 && !selectedGrad) setSelectedGrad(data[0]);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const [issuedCerts, setIssuedCerts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'issued_certificates'), orderBy('issuedAt', 'desc'));
    const unsub = onSnapshot(q, s => {
      setIssuedCerts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const issueCertificate = async (student: Student) => {
    try {
      const certRef = await addDoc(collection(db, 'issued_certificates'), {
        studentId: student.id,
        studentName: student.name,
        course: student.course,
        grade: student.grade,
        issuedAt: Timestamp.now(),
        issuer: profile?.name || 'نظام رحاب التلقائي'
      });
      // Optionally update student record with cert ID
      console.log('Certificate Issued:', certRef.id);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredGrads = graduates.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.course.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-white arabic-font leading-none mb-2">منصة إستخراج الشهادات</h3>
          <p className="text-xs text-slate-500 font-bold arabic-font uppercase">نظام التحقق الذاتي والاعتماد الرسمي لشركة رحاب</p>
        </div>
        
        <div className="flex gap-3">
           <div className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <Users size={18} className="text-indigo-400" />
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase">خريجين مؤهلين</p>
                 <p className="text-sm font-black text-white">{graduates.length}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Graduates List */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 flex flex-col h-[700px]">
           <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-white arabic-font text-sm flex items-center gap-2">
                 <GraduationCap size={18} className="text-indigo-400" />
                 قائمة المؤهلين للاستخراج
              </h4>
           </div>

           <div className="relative mb-6">
              <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="بحث عن خريج..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-12 pl-4 py-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
              />
           </div>

           <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
              {filteredGrads.map(grad => (
                <button
                  key={grad.id}
                  onClick={() => setSelectedGrad(grad)}
                  className={`w-full p-5 rounded-3xl border transition-all text-right group relative overflow-hidden ${
                    selectedGrad?.id === grad.id 
                      ? 'bg-indigo-600/10 border-indigo-500/50' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                     <h5 className="font-black text-white group-hover:text-indigo-400 transition-colors arabic-font">{grad.name}</h5>
                     <CheckCircle2 size={14} className={selectedGrad?.id === grad.id ? 'text-indigo-400' : 'text-slate-700'} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-3 relative z-10">{grad.course}</p>
                  
                  <div className="flex items-center gap-2 relative z-10">
                     <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md uppercase">Grade: {grad.grade}</span>
                     <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md uppercase tracking-wider">Ready</span>
                  </div>

                  {selectedGrad?.id === grad.id && (
                    <motion.div 
                      layoutId="active-grad-bg"
                      className="absolute inset-0 bg-gradient-to-l from-indigo-500/5 to-transparent"
                    />
                  )}
                </button>
              ))}
           </div>
        </div>

        {/* Certificate Preview/Generator */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8">
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
                 <div>
                   <h4 className="text-xl font-black text-white arabic-font mb-1">معاينة الشهادة النهائية</h4>
                   <p className="text-[10px] text-slate-500 font-bold arabic-font">نظام الاستخراج الآلي المبني على تخصص الخريج</p>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black border border-slate-700 hover:bg-slate-700 transition-all"
                    >
                       <Printer size={16} />
                       <span>طباعة</span>
                    </button>
                    <button 
                      onClick={() => issueCertificate(selectedGrad)}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                    >
                       <CheckCircle2 size={16} />
                       <span>اعتماد واستخراج</span>
                    </button>
                 </div>
              </div>

              {selectedGrad ? (
                <div className="relative flex justify-center py-10 bg-slate-950/40 rounded-[2rem] border border-slate-800/50">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={selectedGrad.id}
                    className="w-full max-w-2xl aspect-[1.414/1] bg-white text-slate-900 p-12 relative shadow-2xl overflow-hidden print:shadow-none print:m-0"
                    style={{ direction: 'rtl' }}
                  >
                    {/* Ornamental Border */}
                    <div className="absolute inset-4 border-[12px] border-double border-indigo-600 pointer-events-none"></div>
                    <div className="absolute inset-10 border border-indigo-100 pointer-events-none"></div>

                    {/* Background Tech Watermark */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center rotate-12">
                       <GraduationCap size={400} />
                    </div>

                    <div className="relative z-10 h-full flex flex-col items-center">
                       {/* Logo/Header */}
                       <div className="mb-8 text-center">
                          <div className="flex items-center justify-center gap-2 mb-3">
                             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                <Award size={24} />
                             </div>
                             <h2 className="text-xl font-black text-slate-900 arabic-font tracking-tighter">أكاديمية رحاب للحلول الرقمية</h2>
                          </div>
                          <p className="text-[9px] font-black uppercase text-indigo-600 tracking-[0.3em]">Excellence in Digital Education</p>
                          <div className="w-20 h-1 bg-indigo-600 mx-auto mt-4"></div>
                       </div>

                       <p className="text-sm font-bold text-slate-500 arabic-font mb-6 italic">تشهد إدارة الأكاديمية بأن السيد / السيدة :</p>
                       
                       <h3 className="text-4xl font-black text-slate-950 arabic-font pb-2 mb-8 relative">
                          {selectedGrad.name}
                          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"></div>
                       </h3>

                       <div className="max-w-lg text-center space-y-4 mb-10">
                          <p className="text-sm font-bold text-slate-600 arabic-font leading-relaxed">
                            قد اجتاز بنجاح الدورة التدريبية المكثفة والاختبارات العملية النهائية في تخصص:
                          </p>
                          <div className="bg-indigo-50 border-x-4 border-indigo-600 py-3 px-10 inline-block">
                             <span className="text-2xl font-black text-indigo-900 arabic-font">{selectedGrad.course}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-600 arabic-font leading-relaxed">
                            وقد حصل على تقدير عام <span className="font-black text-indigo-700 underline decoration-indigo-200">({selectedGrad.grade})</span> مما يؤهله للعمل الاحترافي في هذا المجال.
                          </p>
                       </div>

                       <div className="w-full mt-auto flex justify-between items-end px-4">
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Accredited Instructor</p>
                             <p className="text-sm font-black text-slate-800 arabic-font">م. حسام الورداني</p>
                             <div className="w-24 h-px bg-slate-200 mt-2"></div>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                             <div className="p-2 border-2 border-slate-100 rounded-xl">
                                <QrCode size={48} className="text-slate-900" />
                             </div>
                             <span className="text-[8px] font-bold text-slate-400 uppercase">Verify: RAHAB-CERT-{selectedGrad.id.substring(0,8)}</span>
                          </div>

                          <div className="text-left">
                             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">General Manager</p>
                             <p className="text-sm font-black text-slate-800 arabic-font">إدارة رحاب كلاود</p>
                             <div className="w-24 h-px bg-slate-200 mt-2"></div>
                          </div>
                       </div>
                    </div>

                    {/* Corner accents */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 -mr-12 -mt-12 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/5 -ml-12 -mb-12 rounded-full"></div>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-600">
                   <div className="w-20 h-20 rounded-[2.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center mb-6">
                      <FileCheck size={32} className="text-slate-700" />
                   </div>
                   <p className="font-black arabic-font">اختر خريجاً من القائمة الجانبية لبدء عملية الاستخراج</p>
                </div>
              )}
           </div>

           {/* Recent Certificates Log */}
           <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8">
              <h4 className="font-black text-white arabic-font mb-6 flex items-center gap-2">
                 <Filter size={18} className="text-indigo-400" />
                 سجل الاستخراج الأخير
              </h4>
              <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar">
                 {issuedCerts.length > 0 ? issuedCerts.map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center font-black">
                             <CheckCircle2 size={16} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-white arabic-font">تم استخراج شهادة لـ {cert.studentName}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">{cert.course} • {cert.issuedAt?.toDate().toLocaleString('ar-EG')}</p>
                          </div>
                       </div>
                    </div>
                 )) : (
                   <p className="text-center py-6 text-slate-600 text-xs font-bold">لا يوجد شهادات صادرة حالياً</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
