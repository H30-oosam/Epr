import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, Search, Filter, Clock, 
  CheckCircle2, AlertCircle, Calendar, User,
  MoreVertical, Edit3, Trash2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, 
  deleteDoc, doc, updateDoc, orderBy, 
  Timestamp, where
} from 'firebase/firestore';

interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'In Progress' | 'Completed' | 'Pending' | 'Late';
  startDate: string;
  deadline: string;
  createdAt: any;
}

export default function TasksView({ profile }: { profile: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', description: '', assigneeId: '', priority: 'Medium' as const, deadline: ''
  });

  const canWrite = profile?.role === 'admin' || profile?.permissions?.includes('hr:write') || profile?.permissions?.includes('tasks:write');

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    }, (err) => console.warn('Tasks Snapshot error [tasks]:', err.message));

    const unsubEmps = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn('Tasks Snapshot error [employees]:', err.message));

    return () => { unsubTasks(); unsubEmps(); };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignee = employees.find(e => e.id === newTask.assigneeId);
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        assigneeName: assignee?.name || 'Unassigned',
        status: 'Pending',
        startDate: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now()
      });
      setShowAddModal(false);
      setNewTask({ title: '', description: '', assigneeId: '', priority: 'Medium', deadline: '' });
    } catch (error) { console.error(error); }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'tasks', id), { status });
  };

  const deleteTask = async (id: string) => {
    if (window.confirm('Halt task execution?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.assigneeName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-white arabic-font leading-none mb-2">إدارة المهام والعمليات</h3>
          <p className="text-xs text-slate-500 font-bold arabic-font">تتبع الأداء وتوزيع المهام على الكادر الوظيفي</p>
        </div>
        
        {canWrite && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font flex items-center gap-2"
          >
            <Plus size={18} />
            <span>إضافة مهمة جديدة</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard label="إجمالي المهام" value={tasks.length} icon={ClipboardList} color="indigo" />
        <StatusCard label="تحت التنفيذ" value={tasks.filter(t => t.status === 'In Progress').length} icon={Clock} color="amber" />
        <StatusCard label="مكتملة" value={tasks.filter(t => t.status === 'Completed').length} icon={CheckCircle2} color="emerald" />
        <StatusCard label="متأخرة" value={tasks.filter(t => t.status === 'Late').length} icon={AlertCircle} color="rose" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
           <div className="relative">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="بحث في المهمات..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 transition-all font-bold"
              />
           </div>
           <button className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all">
             <Filter size={18} />
           </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
           {filteredTasks.map(task => (
             <div key={task.id} className="bg-slate-950/50 border border-slate-800/60 p-6 rounded-3xl hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                   <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                     task.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                     task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                   }`}>
                     {task.priority} Priority
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-all">
                        <Trash2 size={16} />
                      </button>
                   </div>
                </div>

                <h4 className="text-lg font-black text-white arabic-font mb-2">{task.title}</h4>
                <p className="text-xs text-slate-500 arabic-font line-clamp-2 mb-6">{task.description}</p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-800/40">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                         <User size={16} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-white arabic-font">{task.assigneeName}</p>
                         <p className="text-[8px] text-slate-500 uppercase font-black uppercase">Assignee</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Status</p>
                      <select 
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`text-[9px] font-black px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg outline-none cursor-pointer ${
                          task.status === 'Completed' ? 'text-emerald-400' :
                          task.status === 'In Progress' ? 'text-indigo-400' :
                          task.status === 'Late' ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                         <option value="Pending">Pending</option>
                         <option value="In Progress">In Progress</option>
                         <option value="Completed">Completed</option>
                         <option value="Late">Late</option>
                      </select>
                   </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-slate-600 uppercase">
                   <span className="flex items-center gap-1"><Clock size={10} /> Deadline: {task.deadline}</span>
                   <span className="flex items-center gap-1">Created: {task.startDate}</span>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl"
            >
               <h3 className="text-2xl font-black text-white arabic-font mb-6">إسناد مهمة تشغيلية</h3>
               <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">عنوان المهمة</label>
                    <input 
                      type="text" 
                      required
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">وصف المهمة</label>
                    <textarea 
                      required
                      value={newTask.description}
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold h-24 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">المسؤول</label>
                      <select 
                        required
                        value={newTask.assigneeId}
                        onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      >
                         <option value="">اختر الموظف</option>
                         {employees.map(emp => (
                           <option key={emp.id} value={emp.id}>{emp.name}</option>
                         ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">تاريخ التسليم</label>
                      <input 
                        type="date" 
                        required
                        value={newTask.deadline}
                        onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الأولوية</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['High', 'Medium', 'Low'].map(p => (
                         <button
                           key={p}
                           type="button"
                           onClick={() => setNewTask({...newTask, priority: p as any})}
                           className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                             newTask.priority === p 
                               ? 'bg-indigo-600 text-white border-indigo-600' 
                               : 'bg-slate-950 text-slate-500 border-slate-800'
                           }`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all arabic-font">إضافة المهمة</button>
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

function StatusCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  return (
    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
       <div className={`p-4 rounded-2xl border ${colorMap[color]}`}>
          <Icon size={24} />
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-2xl font-black text-white">{value}</h4>
       </div>
    </div>
  );
}
