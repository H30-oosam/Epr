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
  const [selectedTemplate, setSelectedTemplate] = useState<'default' | 'cfbl' | 'rehab'>('default');
  const [certName, setCertName] = useState('');
  const [certCourse, setCertCourse] = useState('');

  const canWrite = profile?.role === 'admin' || profile?.email === 'hossam@admin.com';

  useEffect(() => {
    if (selectedGrad) {
      setCertName(selectedGrad.name);
      setCertCourse(selectedGrad.course);
    }
  }, [selectedGrad]);

  useEffect(() => {
    // Only fetch students who reached 100% progress
    const q = query(collection(db, 'students'), where('progress', '==', 100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setGraduates(data);
      if (data.length > 0 && !selectedGrad) setSelectedGrad(data[0]);
      setLoading(false);
    }, (err) => {
      console.warn('Certificates Snapshot error [students]:', err.message);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const [issuedCerts, setIssuedCerts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'issued_certificates'), orderBy('issuedAt', 'desc'));
    const unsub = onSnapshot(q, s => {
      setIssuedCerts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('Certificates Snapshot error [issued_certificates]:', err.message));
    return unsub;
  }, []);

  const issueCertificate = async (student: Student) => {
    try {
      const certRef = await addDoc(collection(db, 'issued_certificates'), {
        studentId: student.id,
        studentName: certName || student.name,
        course: certCourse || student.course,
        grade: student.grade,
        issuedAt: Timestamp.now(),
        issuer: profile?.name || 'نظام رحاب التلقائي'
      });
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
                   <h4 className="text-xl font-black text-white arabic-font mb-2">معاينة وتخصيص الشهادة</h4>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedTemplate('default')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedTemplate === 'default' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                         الافتراضي
                      </button>
                      <button 
                        onClick={() => setSelectedTemplate('cfbl')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedTemplate === 'cfbl' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                         أكاديمية CFBL
                      </button>
                      <button 
                        onClick={() => setSelectedTemplate('rehab')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedTemplate === 'rehab' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                         شهادة رحاب
                      </button>
                   </div>
                   
                   {selectedGrad && (
                     <div className="flex gap-3 mt-4">
                        <div className="flex-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">اسم الطالب في الشهادة</label>
                           <input 
                             type="text" 
                             value={certName}
                             onChange={(e) => setCertName(e.target.value)}
                             className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                           />
                        </div>
                        <div className="flex-1">
                           <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">مسمى الدورة</label>
                           <input 
                             type="text" 
                             value={certCourse}
                             onChange={(e) => setCertCourse(e.target.value)}
                             className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                           />
                        </div>
                     </div>
                   )}
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black border border-slate-700 hover:bg-slate-700 transition-all font-mono"
                    >
                       <Printer size={16} />
                       <span>PRINT</span>
                    </button>
                    <button 
                      onClick={() => issueCertificate(selectedGrad!)}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font"
                    >
                       <CheckCircle2 size={16} />
                       <span>اعتماد واستخراج</span>
                    </button>
                 </div>
              </div>

              {selectedGrad ? (
                <div className="relative flex justify-center py-10 bg-slate-950/40 rounded-[2rem] border border-slate-800/50 overflow-hidden">
                  {selectedTemplate === 'default' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`${selectedGrad.id}-default`}
                      className="w-full max-w-2xl aspect-[1.414/1] bg-white text-slate-900 p-12 relative shadow-2xl overflow-hidden print:shadow-none print:m-0"
                      style={{ direction: 'rtl' }}
                    >
                      {/* Ornamental Border */}
                      <div className="absolute inset-4 border-[12px] border-double border-indigo-600 pointer-events-none"></div>
                      <div className="absolute inset-10 border border-indigo-100 pointer-events-none"></div>

                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center rotate-12">
                         <GraduationCap size={400} />
                      </div>

                      <div className="relative z-10 h-full flex flex-col items-center">
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
                            {certName}
                            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent"></div>
                         </h3>
                         <div className="max-w-lg text-center space-y-4 mb-10">
                            <p className="text-sm font-bold text-slate-600 arabic-font leading-relaxed">قد اجتاز بنجاح الدورة التدريبية المكثفة والاختبارات العملية النهائية في تخصص:</p>
                            <div className="bg-indigo-50 border-x-4 border-indigo-600 py-3 px-10 inline-block">
                               <span className="text-2xl font-black text-indigo-900 arabic-font">{certCourse}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 arabic-font leading-relaxed">وقد حصل على تقدير عام <span className="font-black text-indigo-700 underline decoration-indigo-200">({selectedGrad.grade})</span> مما يؤهله للعمل الاحترافي في هذا المجال.</p>
                         </div>
                         <div className="w-full mt-auto flex justify-between items-end px-4">
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Accredited Instructor</p>
                               <p className="text-sm font-black text-slate-800 arabic-font">م. حسام الورداني</p>
                               <div className="w-24 h-px bg-slate-200 mt-2"></div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <div className="p-2 border-2 border-slate-100 rounded-xl"><QrCode size={48} className="text-slate-900" /></div>
                               <span className="text-[8px] font-bold text-slate-400 uppercase">Verify: RAHAB-CERT-{selectedGrad.id.substring(0,8)}</span>
                            </div>
                            <div className="text-left">
                               <p className="text-[10px] font-black text-slate-400 uppercase mb-2">General Manager</p>
                               <p className="text-sm font-black text-slate-800 arabic-font">إدارة رحاب كلاود</p>
                               <div className="w-24 h-px bg-slate-200 mt-2"></div>
                            </div>
                         </div>
                      </div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 -mr-12 -mt-12 rounded-full"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/5 -ml-12 -mb-12 rounded-full"></div>
                    </motion.div>
                  )}

                  {selectedTemplate === 'cfbl' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={`${selectedGrad.id}-cfbl`}
                      className="w-full max-w-2xl aspect-[1.414/1] bg-white text-[#2d3a6d] p-12 relative shadow-2xl overflow-hidden print:shadow-none print:m-0 font-serif"
                    >
                      {/* Side Curves */}
                      <div className="absolute top-0 left-0 w-32 h-full bg-[#2d3a6d] pointer-events-none" style={{ clipPath: 'ellipse(100% 100% at 0% 50%)', opacity: 0.9 }}></div>
                      <div className="absolute top-0 right-0 w-48 h-full bg-[#2d3a6d] pointer-events-none" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 40% 50%, 0 0)' }}></div>
                      <div className="absolute top-0 right-0 w-52 h-full border-l-8 border-[#b4975a] pointer-events-none" style={{ clipPath: 'polygon(100% 0, 100% 100%, 10% 100%, 45% 50%, 10% 0)' }}></div>

                      <div className="relative z-10 flex flex-col items-center h-full pt-10 px-20">
                         <h1 className="text-7xl font-light text-[#b4975a] mb-2 tracking-tight">Certificate</h1>
                         <h2 className="text-3xl font-medium text-[#2d3a6d] mb-10 tracking-widest">Of Appreciation</h2>
                         
                         <div className="bg-[#e6e9f1] px-12 py-3 rounded-full mb-10">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">This certificate is proudly presented To</p>
                         </div>

                         <h3 className="text-5xl font-black mb-12 text-[#2d3a6d] tracking-tight">{certName}</h3>

                         <div className="text-center max-w-lg space-y-4">
                            <p className="text-[11px] font-medium leading-relaxed italic text-slate-600">
                               CFBL Educational Academy is honored to grant this certificate for successfully passing the Professional {certCourse}
                            </p>
                            <p className="text-[11px] font-medium text-slate-600">with all wishes for success and lasting success.</p>
                         </div>

                         <div className="mt-auto w-full flex justify-between items-end pb-8">
                            <div className="flex items-center gap-2">
                               <div className="w-12 h-12 bg-[#2d3a6d] rounded-full flex items-center justify-center text-white font-black text-xl">CFBL</div>
                               <div className="text-[8px] font-bold leading-tight">
                                  <p className="text-[#2d3a6d]">CFBL ACADEMY</p>
                                  <p className="text-[#b4975a]">COURSE FOR A BETTER LIFE</p>
                                </div>
                            </div>
                            <div className="text-center">
                               <div className="mb-1 italic font-serif text-lg border-b border-slate-300 px-4">Rahab</div>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">Authorized Signature</p>
                            </div>
                         </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedTemplate === 'rehab' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={`${selectedGrad.id}-rehab`}
                      className="w-full max-w-2xl aspect-[1.414/1] bg-[#f5e6d3] text-[#004d40] p-0 relative shadow-2xl overflow-hidden print:shadow-none print:m-0"
                    >
                       {/* Top Bar */}
                       <div className="h-24 bg-[#f5e6d3] border-b border-[#004d40] flex items-center px-12 justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-[#004d40] rounded flex items-center justify-center text-white font-bold">R</div>
                             <h4 className="text-lg font-black tracking-widest uppercase">REHAB</h4>
                          </div>
                          <div className="flex gap-1">
                             <div className="w-1 h-8 bg-[#004d40]"></div>
                             <div className="w-1 h-8 bg-emerald-700"></div>
                             <div className="w-1 h-8 bg-emerald-800"></div>
                          </div>
                       </div>

                       {/* Green Ribbon */}
                       <div className="absolute right-12 top-0 bottom-0 w-24 bg-[#004d40] z-20 flex flex-col items-center pt-32">
                          <div className="w-16 h-16 rounded-full border-4 border-[#d4af37] bg-[#004d40] flex items-center justify-center text-[#d4af37] relative">
                             <Award size={32} />
                             <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" />
                                <text x="50" y="50" className="text-[6px] fill-[#d4af37] font-bold tracking-[0.2em] uppercase">
                                   <textPath href="#circlePath">CERTIFICATE OF ACHIEVEMENT • </textPath>
                                </text>
                                <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
                             </svg>
                          </div>
                       </div>

                       <div className="p-20 relative z-10 flex flex-col h-[calc(100%-6rem)]">
                          <h1 className="text-8xl font-serif text-[#004d40] mb-10 opacity-90 tracking-tighter">CERTIFICATE</h1>
                          
                          <div className="mt-4 flex items-start gap-4 mb-8">
                             <span className="text-[#d4af37] text-6xl font-serif leading-none mt-2 rotate-12">to</span>
                             <h2 className="text-5xl font-black text-[#004d40] tracking-tight">{certName}</h2>
                          </div>

                          <div className="max-w-md mt-6">
                             <p className="text-xs font-bold leading-relaxed tracking-wider uppercase opacity-80">
                                HAS SUCCESSFULLY COMPLETED THEIR TRAINING COURSE IN <span className="text-[#d4af37]">{certCourse}</span> AND HAS PASSED IT SUCCESSFULLY. THIS CERTIFICATE IS ISSUED AS A TESTAMENT TO THAT.
                             </p>
                          </div>

                          <div className="mt-auto grid grid-cols-2 gap-12 pb-4">
                             <div>
                                <p className="text-[10px] uppercase font-black text-slate-500 mb-1">date</p>
                                <p className="text-2xl font-serif italic text-[#004d40]">{new Date().toLocaleDateString('ar-EG')}</p>
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-black text-slate-500 mb-1">signature</p>
                                <p className="text-3xl font-serif italic text-[#004d40] opacity-80 border-b border-[#004d40]/20 pb-2">Hossam Rahab</p>
                             </div>
                          </div>
                       </div>

                       {/* Subtle Background Pattern */}
                       <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#004d40 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                    </motion.div>
                  )}
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
