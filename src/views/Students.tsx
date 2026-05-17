import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Plus, Search, Filter, QrCode, 
  Award, Clock, Printer, Trash2, CheckCircle2,
  Phone, Mail, MapPin, UserCheck, AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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
  
  const canWrite = profile?.email === 'hossamelwardany132@gmail.com' || profile?.email === 'hossam@admin.com' || profile?.permissions?.includes('students:write') || profile?.permissions?.includes('student_affairs:write');
  
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

        {/* Certificate Studio */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 flex flex-col items-center">
            
            <div className="w-full flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
               <div>
                 <h3 className="text-xl font-black text-white arabic-font leading-none mb-2">استوديو الشهادات الذكي</h3>
                 <p className="text-xs text-slate-400 font-medium">تصميم وتخصيص شهادات الاعتماد لشركة رحاب</p>
               </div>
               <div className="flex gap-2">
                 <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-xs font-bold border border-slate-700 hover:bg-slate-700 transition-all">
                    <QrCode size={16} />
                    <span>توليد QR</span>
                 </button>
                 <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                >
                    <Printer size={16} />
                    <span>طباعة واعتماد</span>
                 </button>
               </div>
            </div>

            {selectedStudent ? (
              <motion.div 
                layoutId="cert-box"
                className="w-full max-w-2xl aspect-[1.4/1] bg-white text-slate-900 p-12 rounded-lg shadow-2xl relative overflow-hidden transition-all duration-700"
                style={{ direction: 'rtl' }}
              >
                {/* Frame */}
                <div 
                  style={{ 
                    borderColor: currentTemplate.color, 
                    borderStyle: currentTemplate.border as any,
                    borderWidth: '12px'
                  }} 
                  className="absolute inset-6 pointer-events-none rounded-sm"
                ></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full items-center text-center">
                  <div className="mb-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2 inline-block">Official Accreditation</span>
                    <h4 className="text-2xl font-black text-slate-950 arabic-font">أكاديمية رحاب للتميز التقني</h4>
                    <div className="w-16 h-1 bg-indigo-600 mx-auto mt-2"></div>
                  </div>

                  <p className="text-xs text-slate-500 arabic-font font-medium mb-6">نشهد بموجب هذا السند الرسمي أن الطالب:</p>
                  
                  <h5 className="text-3xl font-black text-indigo-700 arabic-font border-b-2 border-indigo-100 px-10 pb-2 mb-8">
                    {selectedStudent.name}
                  </h5>

                  <p className="text-xs text-slate-600 arabic-font font-medium max-w-md leading-relaxed mb-6">
                    قد أتم بنجاح وبكفاءة تشغيلية عالية جميع متطلبات الدراسة العملية والنظرية في البرنامج التدريبي المعتمد:
                  </p>

                  <div className="bg-slate-100 border border-slate-200 px-6 py-3 rounded-2xl mb-8">
                    <span className="text-lg font-black text-slate-950 arabic-font">{selectedStudent.course}</span>
                  </div>

                  <div className="w-full mt-auto flex justify-between items-end px-10">
                    <div className="text-right">
                       <p className="text-[10px] text-slate-400 font-bold mb-1">المحاضر المعتمد:</p>
                       <p className="text-xs font-black text-slate-800 arabic-font">{currentTemplate.lecturer}</p>
                       <div className="w-24 h-[1px] bg-indigo-200 mt-1"></div>
                    </div>

                    <div className="flex flex-col items-center gap-1 opacity-80 group cursor-pointer hover:opacity-100 transition-opacity">
                       <QrCode size={48} className="text-slate-900" />
                       <span className="text-[8px] font-black text-slate-400 font-mono">APP-ID: {selectedStudent.id.substring(0,8)}</span>
                    </div>

                    <div className="text-left">
                       <p className="text-[10px] text-slate-400 font-bold mb-1">الختم والتاريخ:</p>
                       <p className="text-xs font-black text-slate-800 arabic-font">{new Date().toLocaleDateString('ar-EG')}</p>
                       <div className="w-24 h-[1px] bg-slate-200 mt-1"></div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl"></div>
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl"></div>
              </motion.div>
            ) : (
              <div className="py-20 text-center text-slate-500">
                <FileText size={64} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold arabic-font">اختر طالباً للمعاينة المباشرة</p>
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
