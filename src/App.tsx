import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, CreditCard, GraduationCap, 
  Megaphone, Film, ShoppingCart, Headset, LogOut, 
  Menu, X, Bell, Search, MessageSquare, Plus, ChevronRight,
  TrendingUp, Calendar as CalendarIcon, CheckCircle2, AlertCircle,
  ShieldCheck, Bot, Settings, Sliders, Send, Sparkles, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import HRView from './views/HR';
import FinanceView from './views/Finance';
import StudentsView from './views/Students';
import PRView from './views/PR';
import MediaView from './views/Media';
import SalesView from './views/Sales';
import CustomerServiceView from './views/CustomerService';
import UsersView from './views/Users';
import DashboardView from './views/Dashboard';
import TasksView from './views/Tasks';

// --- Types ---
type View = 'dashboard' | 'hr' | 'finance' | 'students' | 'pr' | 'media' | 'sales' | 'customer_service' | 'users' | 'tasks';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  photoURL?: string;
}

// --- Constants ---
const INITIAL_STAFF = [
  { id: 'ADMIN-01', name: 'أحمد محمود الرفاعي', role: 'المدير العام', permissions: ['dashboard', 'hr', 'finance', 'students', 'pr', 'media', 'sales', 'customer_service', 'users'] },
  { id: 'HR-01', name: 'سارة إبراهيم', role: 'أخصائي موارد بشرية', permissions: ['dashboard', 'hr', 'customer_service'] },
  { id: 'FIN-01', name: 'محمود حسن', role: 'المحاسب المالي', permissions: ['dashboard', 'finance'] }
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Look for matching employee record
          let empData: any = null;
          if (u.email) {
            const empQuery = query(collection(db, 'employees'), where('email', '==', u.email));
            const empSnap = await getDocs(empQuery);
            if (!empSnap.empty) {
              const empDoc = empSnap.docs[0];
              empData = empDoc.data();
              // Link employee to this UID for future sync
              await updateDoc(doc(db, 'employees', empDoc.id), { uid: u.uid });
            }
          }

          const isAdmin = u.email === 'hossamelwardany132@gmail.com' || u.email === 'hossam@admin.com';
          const newProfile: UserProfile = {
            uid: u.uid,
            name: u.displayName || empData?.name || 'New User',
            email: u.email || '',
            role: isAdmin ? 'admin' : (empData?.role || 'staff'),
            permissions: isAdmin 
              ? ['dashboard', 'hr', 'finance', 'students', 'pr', 'media', 'sales', 'customer_service', 'users'] 
              : (empData?.permissions || ['dashboard']),
            status: 'active',
            photoURL: u.photoURL || undefined
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        // Check for local storage session (demo mode)
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          const parsed = JSON.parse(demoUser);
          setUser({ uid: 'demo-hossam', email: parsed.email } as any);
          setProfile(parsed);
        } else {
          setProfile(null);
          setUser(null);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email === 'hossam@admin.com' && loginForm.password === 'hossam@admin.com') {
      const demoProfile: UserProfile = {
        uid: 'demo-hossam',
        name: 'Hossam ERP Admin',
        email: 'hossam@admin.com',
        role: 'admin',
        permissions: ['dashboard', 'hr', 'finance', 'students', 'pr', 'media', 'sales', 'customer_service', 'users'],
        status: 'active'
      };
      localStorage.setItem('demo_user', JSON.stringify(demoProfile));
      setUser({ uid: 'demo-hossam', email: 'hossam@admin.com' } as any);
      setProfile(demoProfile);
    } else {
      setLoginError('خطأ في البريد الإلكتروني أو كلمة المرور');
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('demo_user');
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const hasAccess = (view: View) => {
    if (view === 'dashboard') return true;
    return profile?.permissions?.includes(view) ?? false;
  };

  const currentViewContent = useMemo(() => {
    if (!profile) return null;
    if (!hasAccess(currentView)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-900/50 rounded-3xl border border-slate-800/50 p-8 text-center">
          <AlertCircle size={64} className="text-red-500 mb-4 animate-pulse" />
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">عذراً، لا تمتلك صلاحيات الوصول</h3>
          <p className="text-slate-400 mt-2 max-w-md arabic-font font-medium tracking-tight">الدور الوظيفي الخاص بك ({profile.role}) لا يمنحك حق الدخول لهذا القسم. يرجى التواصل مع الإدارة لطلب الصلاحية.</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard': return <DashboardView profile={profile} />;
      case 'hr': return <HRView profile={profile} />;
      case 'finance': return <FinanceView profile={profile} />;
      case 'students': return <StudentsView profile={profile} />;
      case 'pr': return <PRView profile={profile} />;
      case 'media': return <MediaView profile={profile} />;
      case 'sales': return <SalesView profile={profile} />;
      case 'customer_service': return <CustomerServiceView profile={profile} />;
      case 'users': return <UsersView profile={profile} />;
      case 'tasks': return <TasksView profile={profile} />;
      default: return <DashboardView profile={profile} />;
    }
  }, [currentView, profile]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-600/20 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
      </div>
    </div>
  );

  if (!user || !profile) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800 text-center relative z-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/30">
          <GraduationCap size={40} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-black mb-2 arabic-font text-white leading-tight">بوابة رحاب الإدارية</h1>
        <p className="text-slate-400 mb-10 font-bold arabic-font">مرحباً بك في نظام إدارة موارد المؤسسة</p>
        
        <form onSubmit={handleCustomLogin} className="space-y-4 mb-8 text-right">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">البريد الإلكتروني</label>
            <input 
              type="email"
              required
              value={loginForm.email}
              onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
              placeholder="hossam@admin.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">كلمة المرور</label>
            <input 
              type="password"
              required
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
              placeholder="••••••••"
            />
          </div>
          {loginError && <p className="text-red-500 text-[10px] font-black arabic-font text-center">{loginError}</p>}
          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all font-black text-lg shadow-xl shadow-indigo-600/20 arabic-font"
          >
            دخول النظام
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black px-4"><span className="bg-slate-900 text-slate-500 px-2">أو الدخول عبر</span></div>
        </div>
        
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all font-black text-sm border border-slate-700"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" width={18} alt="Google" />
          <span>حساب Google الرسمي</span>
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans no-scrollbar">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="bg-slate-900 border-l border-slate-800 flex flex-col relative z-30 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white arabic-font leading-none mb-1">RAHAB ERP</h1>
            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Enterprise Cloud</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
          <div className="pb-3 px-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Core Functions</span>
          </div>
          <SidebarItem active={currentView === 'dashboard'} icon={LayoutDashboard} label="لوحة التحكم" onClick={() => setCurrentView('dashboard')} />
          <SidebarItem active={currentView === 'tasks'} icon={ClipboardList} label="إدارة المهام" onClick={() => setCurrentView('tasks')} />
          
          <div className="pt-6 pb-3 px-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Departments</span>
          </div>
          <SidebarItem active={currentView === 'hr'} icon={Users} label="الموارد البشرية" onClick={() => setCurrentView('hr')} locked={!hasAccess('hr')} />
          <SidebarItem active={currentView === 'students'} icon={GraduationCap} label="شؤون الطلاب" onClick={() => setCurrentView('students')} locked={!hasAccess('students')} />
          <SidebarItem active={currentView === 'finance'} icon={CreditCard} label="المالية والحسابات" onClick={() => setCurrentView('finance')} locked={!hasAccess('finance')} />
          <SidebarItem active={currentView === 'pr'} icon={Megaphone} label="الفعاليات والعلاقات" onClick={() => setCurrentView('pr')} locked={!hasAccess('pr')} />
          <SidebarItem active={currentView === 'media'} icon={Film} label="الميديا والإنتاج" onClick={() => setCurrentView('media')} locked={!hasAccess('media')} />
          <SidebarItem active={currentView === 'sales'} icon={ShoppingCart} label="المبيعات والمتابعة" onClick={() => setCurrentView('sales')} locked={!hasAccess('sales')} />
          <SidebarItem active={currentView === 'customer_service'} icon={Headset} label="خدمة العملاء" onClick={() => setCurrentView('customer_service')} locked={!hasAccess('customer_service')} />
          
          {hasAccess('users') && (
            <div className="pt-6 border-t border-slate-800/60 mt-6">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 block mb-2 font-mono text-slate-600">SYSTEM NODES</span>
              <SidebarItem active={currentView === 'users'} icon={ShieldCheck} label="أمن النظام" onClick={() => setCurrentView('users')} />
            </div>
          )}
        </nav>

        <div className="p-4 bg-slate-950/40 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <img 
              src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
              className="w-10 h-10 rounded-xl bg-slate-800"
              alt="Avatar" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white arabic-font">{profile.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{profile.role}</p>
            </div>
            <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 px-0 no-scrollbar overflow-hidden">
        <header className="h-16 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <h2 className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 arabic-font">
                {currentView === 'dashboard' && 'اللوحة الرئيسية'}
                {currentView === 'hr' && 'إدارة الموظفين'}
                {currentView === 'students' && 'شؤون الطلاب'}
                {currentView === 'finance' && 'الحسابات'}
                {currentView === 'pr' && 'الفعاليات'}
                {currentView === 'media' && 'الميديا'}
                {currentView === 'sales' && 'المبيعات'}
                {currentView === 'customer_service' && 'الدعم الفني'}
                {currentView === 'users' && 'الصلاحيات'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 relative hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
            </button>
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Bot size={18} className="animate-pulse" />
              <span className="hidden sm:inline">رحاب AI</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {currentViewContent}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} profile={profile} />
    </div>
  );
}

// --- Components ---

function SidebarItem({ active, icon: Icon, label, onClick, locked }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all relative ${
        locked ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:bg-slate-800/50'
      } ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 font-bold' 
          : 'text-slate-400'
      }`}
      disabled={locked}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={active ? 'text-white' : 'text-indigo-400/60'} />
        <span className="text-sm font-bold arabic-font">{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
      {locked && <ShieldCheck size={12} className="text-slate-600" />}
    </button>
  );
}

function AiAssistantModal({ isOpen, onClose, profile }: any) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: `أهلاً بك يا ${profile.name}! أنا مساعد رحاب الذكي. كيف يمكنني مساعدتك في تحليل أداء الشركة اليوم؟` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, context: 'DASHBOARD' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'عذراً، حدث خطأ في النظام.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl h-[600px] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
               <Bot size={24} className="text-white" />
             </div>
             <div>
               <h4 className="font-bold text-white arabic-font leading-none mb-1">رحاب AI الذكي</h4>
               <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Neural Link Active</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-950/10">
          {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-bold leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-slate-800 text-slate-200 rounded-br-none border border-slate-700 shadow-sm' 
                    : 'bg-indigo-600 text-white rounded-bl-none shadow-xl shadow-indigo-600/10'
                }`}>
                  {m.text}
                </div>
             </div>
          ))}
          {loading && (
            <div className="flex justify-end">
               <div className="bg-indigo-600/20 text-indigo-400 p-4 rounded-3xl rounded-bl-none text-xs font-black animate-pulse">
                 جاري تحليل البيانات واستخلاص النتائج...
               </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
           <input 
             type="text" 
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             placeholder="اسأل رحاب AI عن الموقف المالي أو تقارير الإدارات..."
             className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white font-bold transition-all"
           />
           <button 
             onClick={handleSend}
             className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/30 transition-all font-black"
           >
             <Send size={20} />
           </button>
        </div>
      </motion.div>
    </div>
  );
}
