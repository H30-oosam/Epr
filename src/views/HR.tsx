import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, Trash2, 
  CheckCircle2, AlertCircle, ShieldCheck, 
  DollarSign, Briefcase, Calendar, Clock,
  MoreVertical, Edit3, ShieldAlert, Fingerprint,
  FileText, Award, GraduationCap, ClipboardList,
  ChevronRight, TrendingUp, UserCheck, Mail,
  Phone, Building2, UserX, UserMinus, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, query, onSnapshot, addDoc, 
  deleteDoc, doc, updateDoc, orderBy, 
  Timestamp, where, getDoc, getDocs 
} from 'firebase/firestore';

type HRTab = 'employees' | 'attendance' | 'salaries' | 'leaves' | 'recruitment' | 'performance' | 'training' | 'contracts' | 'reports';

interface Employee {
  id: string;
  name: string;
  email?: string;
  uid?: string;
  role: string;
  dept: string;
  salary: number;
  status: 'نشط' | 'إجازة' | 'معلق' | 'منتهي الخدمة';
  joinDate: string;
  permissions: string[];
  photoURL?: string;
  employeeNumber: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  timeIn?: string;
  timeOut?: string;
  location?: { lat: number, lng: number };
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: 'قيد الانتظار' | 'مقبول' | 'مرفوض';
}

export default function HRView({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState<HRTab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: '', email: '', role: 'موظف', dept: 'الموارد البشرية', salary: 0, employeeNumber: '', photoURL: ''
  });

  const canWrite = (module: string) => {
    return profile?.email === 'hossamelwardany132@gmail.com' || profile?.email === 'hossam@admin.com' || profile?.permissions?.includes(`${module}:write`);
  };

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (err) => console.warn('HR Snapshot error [employees]:', err.message));

    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    }, (err) => console.warn('HR Snapshot error [attendance]:', err.message));

    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snapshot) => {
      setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest)));
    }, (err) => console.warn('HR Snapshot error [leaves]:', err.message));

    setLoading(false);
    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubLeaves();
    };
  }, []); // Run once on mount

  // Computed data for UI (merging employees info)
  const mappedAttendance = useMemo(() => {
    return attendance.map(record => ({
      ...record,
      employeeName: employees.find(e => e.id === record.employeeId)?.name || 'غير معروف'
    }));
  }, [attendance, employees]);

  const mappedLeaves = useMemo(() => {
    return leaves.map(req => ({
      ...req,
      employeeName: employees.find(e => e.id === req.employeeId)?.name || 'غير معروف'
    }));
  }, [leaves, employees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'employees'), {
        ...newEmp,
        status: 'نشط',
        joinDate: new Date().toISOString().split('T')[0],
        permissions: ['dashboard'],
        photoURL: newEmp.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newEmp.name}`
      });
      setShowAddModal(false);
      setNewEmp({ name: '', email: '', role: 'موظف', dept: 'الموارد البشرية', salary: 0, employeeNumber: '', photoURL: '' });
    } catch (error) { console.error(error); }
  };

  const deleteEmp = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف ملف الموظف؟')) {
      await deleteDoc(doc(db, 'employees', id));
    }
  };

  const recordAttendance = async (empId: string, type: 'IN' | 'OUT') => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    try {
      // Get GPS location
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        if (type === 'IN') {
          await addDoc(collection(db, 'attendance'), {
            employeeId: empId,
            date: dateStr,
            timeIn: timeStr,
            status: 'present',
            location,
            createdAt: Timestamp.now()
          });
        } else {
          const q = query(collection(db, 'attendance'), where('employeeId', '==', empId), where('date', '==', dateStr));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
             await updateDoc(doc(db, 'attendance', snapshot.docs[0].id), { timeOut: timeStr });
          }
        }
      });
    } catch (err) { console.warn('Attendance failed:', err); }
  };

  const updateLeaveStatus = async (id: string, status: 'مقبول' | 'مرفوض') => {
    await updateDoc(doc(db, 'leaves', id), { status });
  };

  const updateEmpStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'employees', id), { status });
  };

  const [selectedEmpForPayslip, setSelectedEmpForPayslip] = useState<Employee | null>(null);

  const togglePermission = async (empId: string, perm: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const newPerms = (emp.permissions || []).includes(perm)
      ? emp.permissions.filter(p => p !== perm)
      : [...(emp.permissions || []), perm];
    
    try {
      await updateDoc(doc(db, 'employees', empId), { permissions: newPerms });
      
      // Sync with users collection if linked
      if (emp.uid) {
        await updateDoc(doc(db, 'users', emp.uid), { permissions: newPerms });
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      {/* HR Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-white arabic-font leading-none mb-2">المركز الذكي للموارد البشرية</h3>
          <div className="flex items-center gap-3">
             <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest">
               <ShieldCheck size={12} /> HR Master Protocol
             </span>
             <span className="text-xs text-slate-500 font-bold arabic-font">إدارة رأس المال البشري بمؤسسة رحاب</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
           {canWrite('hr') && (
             <button 
               onClick={() => setShowAddModal(true)}
               className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font flex items-center gap-2"
             >
               <UserPlus size={18} />
               <span>توظيف كادر جديد</span>
             </button>
           )}
           <button className="p-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl hover:text-white transition-all">
             <Calendar size={18} />
           </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="إجمالي الكادر" value={employees.length} icon={Users} color="indigo" />
         <MetricCard label="الحاضرون اليوم" value={Math.floor(employees.length * 0.9)} icon={Fingerprint} color="emerald" />
         <MetricCard label="طلبات إجازة" value={mappedLeaves.filter(l => l.status === 'قيد الانتظار').length} icon={Clock} color="amber" />
         <MetricCard label="ميزانية الرواتب" value={`${(employees.reduce((acc, curr) => acc + curr.salary, 0) / 1000).toFixed(1)}k`} icon={DollarSign} color="violet" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
         {[
           { id: 'employees', label: 'الموظفين', icon: Users },
           { id: 'attendance', label: 'الحضور', icon: Fingerprint },
           { id: 'salaries', label: 'الرواتب', icon: DollarSign },
           { id: 'leaves', label: 'الإجازات', icon: Calendar },
           { id: 'recruitment', label: 'التوظيف', icon: UserPlus },
           { id: 'performance', label: 'الأداء', icon: Award },
           { id: 'training', label: 'التدريب', icon: GraduationCap },
           { id: 'contracts', label: 'العقود', icon: FileText },
           { id: 'reports', label: 'التقارير', icon: ClipboardList }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as HRTab)}
             className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border arabic-font ${
               activeTab === tab.id 
                 ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20' 
                 : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
             }`}
           >
             <tab.icon size={16} />
             {tab.label}
           </button>
         ))}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
           {/* Tab Headers */}
           <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/20">
              <div>
                 <h4 className="text-xl font-black text-white arabic-font leading-tight">
                   {activeTab === 'employees' && 'إدارة شؤون الموظفين'}
                   {activeTab === 'attendance' && 'سجل الحضور والانصراف الذكي'}
                   {activeTab === 'salaries' && 'نظام كشوف المرتبات والحوافز'}
                   {activeTab === 'leaves' && 'معالجة الإجازات والغيابات'}
                   {activeTab === 'recruitment' && 'بوابة التوظيف والمقابلات'}
                   {activeTab === 'performance' && 'تقييم الأداء والمؤشرات (KPIs)'}
                   {activeTab === 'training' && 'البرامج التدريبية والتطوير'}
                   {activeTab === 'contracts' && 'إدارة العقود والوثائق القانونية'}
                   {activeTab === 'reports' && 'مركز التقارير والتحليلات البيانية'}
                 </h4>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                   {activeTab === 'employees' && 'Employee Records & Permissions Matrix'}
                   {activeTab === 'attendance' && 'Biometric Authentication Sync'}
                   {activeTab === 'salaries' && 'Financial Compensation Node'}
                   {activeTab === 'leaves' && 'Vacation Entitlement Management'}
                   {activeTab === 'recruitment' && 'Candidate Pipeline & Talent Acquisition'}
                   {activeTab === 'performance' && 'Strategic Performance Metrics'}
                   {activeTab === 'training' && 'Upskilling & Skill Matrix Development'}
                   {activeTab === 'contracts' && 'Legal Agreement Repository'}
                   {activeTab === 'reports' && 'Human Capital Data Analytics'}
                 </p>
              </div>
              <div className="relative">
                 <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="بحث..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-64 transition-all"
                 />
              </div>
           </div>

           {/* Tab Body */}
           <div className="p-0">
             {activeTab === 'employees' && (
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 font-black uppercase tracking-tighter border-b border-slate-800">
                <th className="p-6">الموظف</th>
                <th className="p-6 text-center">HR (R/W/S)</th>
                <th className="p-6 text-center">الطلاب (R/W)</th>
                <th className="p-6 text-center">المالية (R/W)</th>
                <th className="p-6 text-center">المبيعات (R/W)</th>
                <th className="p-6 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {employees.filter(e => (e.name || '').includes(search)).map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                       <img 
                         src={emp.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`} 
                         className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                         alt=""
                       />
                       <div>
                          <p className="font-black text-white text-sm arabic-font">{emp.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-tight">
                            {emp.employeeNumber || 'ID-NEW'} • {emp.role}<br/>
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              emp.status === 'نشط' ? 'bg-emerald-500' : 
                              emp.status === 'إجازة' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}></span> {emp.status}
                          </p>
                       </div>
                    </div>
                  </td>
                  <td className="p-6">
                     <div className="flex flex-col items-center gap-1">
                        <PermToggle active={emp.permissions?.includes('hr:read')} onClick={() => togglePermission(emp.id, 'hr:read')} label="عرض" />
                        <PermToggle active={emp.permissions?.includes('hr:write')} onClick={() => togglePermission(emp.id, 'hr:write')} label="تعديل" />
                        <PermToggle active={emp.permissions?.includes('hr:salary')} onClick={() => togglePermission(emp.id, 'hr:salary')} label="رواتب" />
                     </div>
                  </td>
                  <td className="p-6">
                     <div className="flex flex-col items-center gap-1">
                        <PermToggle active={emp.permissions?.includes('students:read')} onClick={() => togglePermission(emp.id, 'students:read')} label="عرض" />
                        <PermToggle active={emp.permissions?.includes('students:write')} onClick={() => togglePermission(emp.id, 'students:write')} label="تعديل" />
                     </div>
                  </td>
                  <td className="p-6">
                     <div className="flex flex-col items-center gap-1">
                        <PermToggle active={emp.permissions?.includes('finance:read')} onClick={() => togglePermission(emp.id, 'finance:read')} label="عرض" />
                        <PermToggle active={emp.permissions?.includes('finance:write')} onClick={() => togglePermission(emp.id, 'finance:write')} label="تعديل" />
                     </div>
                  </td>
                  <td className="p-6">
                     <div className="flex flex-col items-center gap-1">
                        <PermToggle active={emp.permissions?.includes('sales:read')} onClick={() => togglePermission(emp.id, 'sales:read')} label="عرض" />
                        <PermToggle active={emp.permissions?.includes('sales:write')} onClick={() => togglePermission(emp.id, 'sales:write')} label="تعديل" />
                     </div>
                  </td>
                  <td className="p-6 text-left">
                    <div className="flex items-center gap-1 justify-end">
                       <button className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all"><Edit3 size={16} /></button>
                       {canWrite('hr') && (
                         <button onClick={() => deleteEmp(emp.id)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                       )}
                       <select 
                          value={emp.status}
                          onChange={(e) => updateEmpStatus(emp.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-black p-1 outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                           <option value="نشط">Active</option>
                           <option value="إجازة">Leave</option>
                           <option value="معلق">Suspended</option>
                           <option value="منتهي الخدمة">Terminated</option>
                        </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
                  </table>
               </div>
             )}

             {activeTab === 'attendance' && (
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map(emp => (
                     <div key={emp.id} className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden border border-slate-800">
                              <img 
                                src={emp.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`} 
                                className="w-full h-full object-cover" 
                                alt=""
                              />
                           </div>
                           <div>
                              <h5 className="text-sm font-black text-white arabic-font">{emp.name}</h5>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{emp.employeeNumber || 'ID-PENDING'}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => recordAttendance(emp.id, 'IN')} className="px-3 py-1.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">IN</button>
                           <button onClick={() => recordAttendance(emp.id, 'OUT')} className="px-3 py-1.5 bg-rose-600/10 text-rose-400 border border-rose-500/10 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">OUT</button>
                        </div>
                     </div>
                  ))}
               </div>
             )}

             {activeTab === 'leaves' && (
               <div className="p-8 space-y-4">
                  {mappedLeaves.length === 0 ? (
                    <div className="text-center py-20 bg-slate-950/20 rounded-[2rem] border-2 border-dashed border-slate-800">
                       <Mail className="mx-auto text-slate-700 mb-4" size={48} />
                       <p className="text-slate-500 font-black arabic-font">لا توجد طلبات إجازة معلقة حالياً</p>
                    </div>
                  ) : (
                    mappedLeaves.map(req => (
                      <div key={req.id} className="bg-slate-950 border border-slate-800 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white">
                               <Calendar size={24} className="text-indigo-500" />
                            </div>
                            <div>
                               <h5 className="text-lg font-black text-white arabic-font mb-1">{req.employeeName}</h5>
                               <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
                                  <span className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-500" /> {req.type}</span>
                                  <span className="flex items-center gap-1.5"><Calendar size={12} className="text-indigo-500" /> {req.startDate} إلى {req.endDate}</span>
                               </div>
                               <p className="text-xs text-slate-400 mt-2 arabic-font">{req.reason}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            {req.status === 'قيد الانتظار' ? (
                               <>
                                  <button 
                                    onClick={() => updateLeaveStatus(req.id, 'مقبول')} 
                                    disabled={!canWrite('hr')}
                                    className={`px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all ${!canWrite('hr') && 'opacity-50 cursor-not-allowed'}`}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => updateLeaveStatus(req.id, 'مرفوض')} 
                                    disabled={!canWrite('hr')}
                                    className={`px-6 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase border border-slate-700 hover:bg-slate-700 hover:text-white transition-all ${!canWrite('hr') && 'opacity-50 cursor-not-allowed'}`}
                                  >
                                    Reject
                                  </button>
                                </>
                            ) : (
                               <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${
                                 req.status === 'مقبول' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                               }`}>
                                 {req.status}
                               </span>
                            )}
                         </div>
                      </div>
                    ))
                  )}
               </div>
             )}

             {activeTab === 'salaries' && (
                <div className="p-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payroll (This Month)</p>
                         <h4 className="text-2xl font-black text-white">EGP 145,200</h4>
                      </div>
                      <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bonuses Disbursed</p>
                         <h4 className="text-2xl font-black text-emerald-400">EGP 12,500</h4>
                      </div>
                      <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tax/Insurance Reserve</p>
                         <h4 className="text-2xl font-black text-indigo-400">EGP 24,800</h4>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      {employees.map(emp => (
                         <div key={emp.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-900 rounded-2xl hover:bg-slate-950 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 font-black">
                                  <DollarSign size={18} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-white arabic-font">{emp.name}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">{emp.role}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-white">EGP {emp.salary.toLocaleString()}</p>
                               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Approved for Payout</span>
                            </div>
                            <button className="p-2.5 bg-slate-900 text-slate-400 rounded-xl border border-slate-800 hover:text-indigo-400 transition-all">
                               <MoreVertical size={16} />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {activeTab === 'recruitment' && (
                <div className="p-8">
                   <div className="flex justify-between items-center mb-8">
                      <h5 className="text-lg font-black text-white arabic-font">قائمة المتقدمين للعمل</h5>
                      <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all uppercase">
                        <Plus size={14} /> Add Applicant
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { n: 'خالد مصطفى', p: 'مطور برمجيات', s: 'مقابلة', sc: 'amber' },
                        { n: 'نوران حسن', p: 'أخصائي ميديا', s: 'جديد', sc: 'indigo' },
                        { n: 'إبراهيم علي', p: 'محاسب مالي', s: 'عرض عمل', sc: 'emerald' },
                        { n: 'ياسمين السيد', p: 'خدمة عملاء', s: 'مرفوض', sc: 'rose' }
                      ].map((cand, i) => (
                         <div key={i} className="bg-slate-950 border border-slate-900 p-6 rounded-3xl hover:border-indigo-500/20 transition-all">
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500">
                                     <UserCheck size={20} />
                                  </div>
                                  <div>
                                     <h6 className="text-sm font-black text-white arabic-font">{cand.n}</h6>
                                     <span className="text-[10px] text-slate-500 font-bold uppercase">{cand.p}</span>
                                  </div>
                               </div>
                               <span className={`text-[9px] font-black px-2 py-1 rounded-lg border bg-${cand.sc}-500/10 text-${cand.sc}-400 border-${cand.sc}-500/20`}>
                                 {cand.s}
                               </span>
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-slate-900">
                               <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase transition-all">View CV</button>
                               <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10">
                                 <Mail size={14} />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {activeTab === 'performance' && (
               <div className="p-8">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white mb-8 shadow-2xl shadow-indigo-600/20">
                     <div className="flex items-center gap-4 mb-4">
                        <TrendingUp size={32} className="opacity-50" />
                        <h5 className="text-xl font-black arabic-font">مؤشر رضاء الكادر العام</h5>
                     </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter">94%</span>
                        <span className="text-xs font-bold opacity-70">+4.2% من الشهر الماضي</span>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     {employees.slice(0, 3).map(emp => (
                        <div key={emp.id} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
                           <div className="flex justify-between items-center mb-4">
                              <span className="text-sm font-black text-white arabic-font">{emp.name}</span>
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Excellent Performance</span>
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                                 <span>KPI Achievement</span>
                                 <span>{85 + (employees.indexOf(emp) * 5)}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${85 + (employees.indexOf(emp) * 5)}%` }}
                                   className="h-full bg-indigo-600 rounded-full"
                                 />
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'training' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[
                     { t: 'أساسيات الأمن التكنولوجي', d: '2024-05-20', s: 'جارٍ' },
                     { t: 'استراتيجيات التواصل الفعال', d: '2024-06-05', s: 'مخطط' },
                     { t: 'إدارة الوقت والذكاء العاطفي', d: '2024-04-12', s: 'مكتمل' }
                   ].map((train, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 p-8 rounded-[2rem] flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                        <div className="mb-6">
                           <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-slate-900 rounded-2xl text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                 <GraduationCap size={24} />
                              </div>
                              <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${
                                train.s === 'جارٍ' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
                              }`}>
                                {train.s}
                              </span>
                           </div>
                           <h6 className="text-lg font-black text-white arabic-font mb-2 leading-tight">{train.t}</h6>
                           <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                              <Calendar size={12} />
                              <span>{train.d}</span>
                           </div>
                        </div>
                        <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black arabic-font border border-slate-800 transition-all">تحميل الخطة التدريبية</button>
                      </div>
                   ))}
                </div>
             )}

             {activeTab === 'contracts' && (
               <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {employees.map(emp => (
                        <div key={emp.id} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500">
                                 <FileText size={24} />
                              </div>
                              <div>
                                 <h6 className="text-sm font-black text-white arabic-font">{emp.name}</h6>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Contract valid until 2025</p>
                              </div>
                           </div>
                           <button className="p-2.5 bg-slate-900 text-slate-400 rounded-xl hover:text-indigo-400 transition-all">
                              <ChevronRight size={20} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
             )}

             {activeTab === 'reports' && (
               <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-900">
                        <TrendingUp className="text-indigo-500 mb-4" size={32} />
                        <h6 className="text-lg font-black text-white arabic-font mb-2">معدل الدوران الوظيفي</h6>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">تحليل نسبة استجابة الكادر واستمراريته خلال الـ 12 شهراً الماضية.</p>
                     </div>
                     <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-900">
                        <ClipboardList className="text-indigo-500 mb-4" size={32} />
                        <h6 className="text-lg font-black text-white arabic-font mb-2">توزيع الميزانية التشغيلية</h6>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">عرض بياني لتوزيع الرواتب والحوافز والمصروفات الإدارية لكل قسم.</p>
                     </div>
                     <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-900">
                        <Users className="text-indigo-500 mb-4" size={32} />
                        <h6 className="text-lg font-black text-white arabic-font mb-2">تحليل التنوع والشمول</h6>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">إحصائيات دقيقة حول توزيع الكادر وظيفياً وعمرياً وجغرافياً.</p>
                     </div>
                  </div>
                  <button className="w-full py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all arabic-font">استخراج ملف التقارير السنوي الشامل (PDF)</button>
               </div>
             )}
           </div>
        </motion.div>
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl"
            >
               <h3 className="text-2xl font-black text-white arabic-font mb-6 leading-none">تسجيل كادر وظيفي جديد</h3>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">اسم الموظف الثلاثي</label>
                      <input 
                        type="text" 
                        required
                        value={newEmp.name}
                        onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الرقم الوظيفي</label>
                      <input 
                        type="text" 
                        required
                        value={newEmp.employeeNumber}
                        onChange={e => setNewEmp({...newEmp, employeeNumber: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                        placeholder="RH-001"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">البريد الإلكتروني (للدخول إلى النظام)</label>
                    <input 
                      type="email" 
                      value={newEmp.email}
                      onChange={e => setNewEmp({...newEmp, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                      placeholder="employee@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الدور الوظيفي</label>
                      <input 
                        type="text" 
                        required
                        value={newEmp.role}
                        onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الراتب المتفق عليه</label>
                      <input 
                        type="number" 
                        required
                        value={newEmp.salary}
                        onChange={e => setNewEmp({...newEmp, salary: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">القسم</label>
                    <select 
                      value={newEmp.dept}
                      onChange={e => setNewEmp({...newEmp, dept: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    >
                      <option value="الإدارة العليا">الإدارة العليا</option>
                      <option value="الموارد البشرية">الموارد البشرية</option>
                      <option value="المالية">المالية</option>
                      <option value="الميديا">الميديا والإنتاج</option>
                      <option value="المبيعات">المبيعات</option>
                      <option value="الدعم الفنى">الدعم الفنى</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font">إتمام القيد</button>
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black border border-slate-700 arabic-font">إلغاء</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payslip Modal */}
      <AnimatePresence>
        {selectedEmpForPayslip && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white text-slate-900 p-12 rounded-none w-full max-w-2xl shadow-2xl relative font-sans overflow-y-auto max-h-[90vh]"
            >
               <button onClick={() => setSelectedEmpForPayslip(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
               
               <div className="flex justify-between items-center border-b-2 border-slate-900 pb-8 mb-8">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">RAHAB ENTERPRISE</h2>
                    <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">OFFICIAL SALARY STATEMENT</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Statement ID: #PS-{selectedEmpForPayslip.employeeNumber}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-12 mb-12">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Employee Information</p>
                    <h4 className="text-xl font-bold arabic-font mb-1">{selectedEmpForPayslip.name}</h4>
                    <p className="text-xs font-bold text-slate-600 uppercase">{selectedEmpForPayslip.role} • {selectedEmpForPayslip.dept}</p>
                    <p className="text-xs font-bold text-slate-600 uppercase mt-1">ID: {selectedEmpForPayslip.employeeNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Company Details</p>
                    <p className="text-xs font-black uppercase">Rahab Cloud Solutions</p>
                    <p className="text-xs font-bold text-slate-600 uppercase mt-1">Cairo HQ • Finance Dept</p>
                  </div>
               </div>

               <div className="space-y-4 mb-12">
                  <div className="flex justify-between items-center py-4 border-b border-slate-100">
                     <span className="text-xs font-bold uppercase text-slate-500">Base Salary</span>
                     <span className="text-sm font-black font-mono">EGP {selectedEmpForPayslip.salary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-100">
                     <span className="text-xs font-bold uppercase text-slate-500">Attendance Bonus</span>
                     <span className="text-sm font-black font-mono text-emerald-600">+ EGP 1,200</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-100">
                     <span className="text-xs font-bold uppercase text-slate-500">Tax & Insurance (15%)</span>
                     <span className="text-sm font-black font-mono text-rose-600">- EGP {(selectedEmpForPayslip.salary * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-6 bg-slate-50 px-4 mt-8">
                     <span className="text-sm font-black uppercase tracking-widest text-slate-900">Net Payable Amount</span>
                     <span className="text-2xl font-black font-mono text-indigo-600">EGP {(selectedEmpForPayslip.salary * 0.85 + 1200).toLocaleString()}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-200">
                  <div className="text-center">
                    <div className="h-20 border-b border-slate-300 mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Finance Manager Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="h-20 border-b border-slate-300 mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Employee Acknowledgment</p>
                  </div>
               </div>
               
               <div className="mt-12 text-center">
                  <button className="px-10 py-4 bg-slate-900 text-white rounded-none font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">Download PDF Statement</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PermToggle({ active, onClick, label }: { active: boolean, onClick: () => void, label?: string }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[8px] font-black text-slate-400 uppercase w-7 text-left">{label}</span>}
      <button 
        onClick={onClick}
        className={`w-8 h-4 rounded-full transition-all relative ${
          active ? 'bg-indigo-600' : 'bg-slate-800'
        }`}
      >
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
          active ? 'left-4.5' : 'left-0.5'
        }`}></div>
      </button>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
  };

  return (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
       <div className={`p-4 rounded-2xl border ${colorMap[color]}`}>
         <Icon size={24} />
       </div>
       <div>
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
         <h4 className="text-2xl font-black text-white leading-none">{value}</h4>
       </div>
    </div>
  );
}

