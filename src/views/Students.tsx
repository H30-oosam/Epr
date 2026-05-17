import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Plus, Search, Filter, QrCode, 
  Award, Clock, Printer, Trash2, CheckCircle2,
  Phone, Mail, MapPin, UserCheck, AlertCircle,
  FileText, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  course: string;
  phone: string;
  progress: number;
  grade: string;
  paymentStatus: string;
  templateId: string;
  attendanceRate: number;
}

const TEMPLATES = [
  { id: 'CERT-01', title: 'شهادة التميز والاجتياز الرقمي', lecturer: 'د. أحمد محمود الرفاعي', color: '#4f46e5', border: 'double' },
  { id: 'CERT-02', title: 'شهادة الاحتراف التسويقي', lecturer: 'أ. سارة إبراهيم', color: '#059669', border: 'solid' },
];

export default function StudentsView({ profile }: { profile: any }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [certHistory, setCertHistory] = useState<any[]>([]);
  
  const canWrite = profile?.email === 'hossamelwardany132@gmail.com' || profile?.email === 'hossam@admin.com' || profile?.permissions?.includes('students:write') || profile?.permissions?.includes('student_affairs:write');
  
  // Fetch certificate history for selected student
  useEffect(() => {
    if (!selectedStudent) return;
    const q = query(collection(db, 'issued_certificates'), where('studentId', '==', selectedStudent.id));
    const unsub = onSnapshot(q, s => {
      setCertHistory(s.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a, b) => (b.issuedAt?.seconds || 0) - (a.issuedAt?.seconds || 0)));
    }, (err) => console.warn('Cert History Snapshot error:', err.message));
    return unsub;
  }, [selectedStudent]);
  
  // For New Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '', course: 'دبلومة تطوير الويب الكاملة', phone: '', totalPaid: 0, grade: 'امتياز', templateId: 'CERT-01'
  });

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
      if (data.length > 0 && !selectedStudent) setSelectedStudent(data[0]);
      setLoading(false);
    }, (err) => console.warn('Students Snapshot error:', err.message));
    return unsubscribe;
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'students'), {
        ...newStudent,
        progress: Math.floor(Math.random() * 40) + 60,
        paymentStatus: newStudent.totalPaid > 5000 ? 'مسدد بالكامل' : 'قيد التقسيط',
        attendanceRate: 95
      });
      setShowAddModal(false);
      setNewStudent({ name: '', course: 'دبلومة تطوير الويب الكاملة', phone: '', totalPaid: 0, grade: 'امتياز', templateId: 'CERT-01' });
    } catch (error) {
      console.error(error);
    }
  };

  const currentTemplate = TEMPLATES.find(t => t.id === selectedStudent?.templateId) || TEMPLATES[0];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/10 text-indigo-400 rounded-2xl flex items-center justify-center">
              <UserCheck size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">إجمالي المسجلين</p>
              <h4 className="text-2xl font-black text-white">{students.length} طالب</h4>
            </div>
         </div>
         <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600/10 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Award size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">شهادات صادرة</p>
              <h4 className="text-2xl font-black text-white">{students.filter(s => s.progress === 100).length} شهادة</h4>
            </div>
         </div>
         <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600/10 text-amber-400 rounded-2xl flex items-center justify-center">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">قيد التعلم</p>
              <h4 className="text-2xl font-black text-white">{students.filter(s => s.progress < 100).length} محصل</h4>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Student List Sidebar */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 h-[720px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white arabic-font">قائمة الطلاب</h3>
            {canWrite && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all"
              >
                <Plus size={20} />
              </button>
            )}
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="بحث عن طالب..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
            {students.filter(s => (s.name || '').includes(search)).map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`w-full p-4 rounded-3xl border transition-all text-right group ${
                  selectedStudent?.id === s.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{s.name}</h5>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                    s.progress === 100 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {s.progress}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{s.course}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Student details & History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8">
            {selectedStudent ? (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                       <GraduationCap size={48} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-white arabic-font mb-2">{selectedStudent.name}</h3>
                       <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedStudent.course}</span>
                          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest">UID: {selectedStudent.id.substring(0,8)}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">نسبة الحضور</p>
                        <div className="flex items-center gap-3">
                           <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${selectedStudent.attendanceRate}%` }} className="h-full bg-indigo-500" />
                           </div>
                           <span className="text-sm font-black text-white">{selectedStudent.attendanceRate}%</span>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h4 className="font-black text-white arabic-font flex items-center gap-2">
                         <Phone size={18} className="text-indigo-400" />
                         بيانات التواصل
                      </h4>
                      <div className="space-y-3">
                         <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">رقم الهاتف</span>
                            <span className="text-sm font-bold text-white">{selectedStudent.phone}</span>
                         </div>
                         <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معلومات الدفع</span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${selectedStudent.paymentStatus === 'مسدد بالكامل' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                               {selectedStudent.paymentStatus}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="font-black text-white arabic-font flex items-center gap-2">
                         <Award size={18} className="text-indigo-400" />
                         سجل الشهادات المستخرجة
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                         {certHistory.length > 0 ? certHistory.map(cert => (
                            <div key={cert.id} className="p-4 bg-slate-950 border border-indigo-500/20 rounded-2xl flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                                     <CheckCircle2 size={20} />
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-white arabic-font">{cert.course}</p>
                                     <p className="text-[10px] font-bold text-slate-500 uppercase">{cert.issuedAt?.toDate().toLocaleDateString('ar-EG')} • Grade: {cert.grade}</p>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => window.open(`/verify/${cert.id}`, '_blank')}
                                 className="opacity-0 group-hover:opacity-100 p-2 text-indigo-400 hover:text-white transition-all"
                               >
                                  <ExternalLink size={16} />
                               </button>
                            </div>
                         )) : (
                           <div className="p-10 border-2 border-dashed border-slate-800 rounded-3xl text-center">
                              <p className="text-xs text-slate-500 font-bold arabic-font italic">لم يتم استخراج أي شهادات لهذا الطالب بعد</p>
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end">
                   <div className="flex items-center gap-3 text-slate-500">
                      <Clock size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">آخر تحديث لنشاط الطالب: {new Date().toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-40 text-center">
                <GraduationCap size={80} className="mx-auto mb-6 text-slate-800" />
                <p className="text-slate-500 font-black arabic-font">اختر طالباً من القائمة لعرض ملفه الشخصي وسجل إنجازاته</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl"
            >
               <h3 className="text-2xl font-black text-white arabic-font mb-6 leading-none">قيد طالب جديد في رحاب</h3>
               <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الاسم الرباعي</label>
                    <input 
                      type="text" 
                      required
                      value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">رقم الجوال</label>
                      <input 
                        type="text" 
                        required
                        value={newStudent.phone}
                        onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">المبلغ المدفوع</label>
                      <input 
                        type="number" 
                        value={newStudent.totalPaid}
                        onChange={e => setNewStudent({...newStudent, totalPaid: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الدبلومة المستهدفة</label>
                    <select 
                      value={newStudent.course}
                      onChange={e => setNewStudent({...newStudent, course: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value="دبلومة تطوير الويب الكاملة">دبلومة تطوير الويب الكاملة</option>
                      <option value="دبلومة التسويق الرقمي">دبلومة التسويق الرقمي</option>
                      <option value="كورس صناعة المحتوى">كورس صناعة المحتوى</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font">حفظ القيد</button>
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
