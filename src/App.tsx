/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  LogOut,
  User,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Calendar,
  AlertCircle,
  Bell,
  Send,
  Loader2,
  X,
  KeyRound,
  Mail,
  Lock,
  Menu,
  Archive,
  Settings,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isPast, isToday, addDays, isWithinInterval, parseISO, differenceInDays, isValid, parse, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task, TaskStatus, TaskType, Manager, User as UserType } from './types';
import { cn } from './lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

// Helper to parse dates from various formats (Sheets often returns DD/MM/YYYY)
function safeParseDate(dateStr: string) {
  if (!dateStr) return null;
  // Try ISO first
  let date = parseISO(dateStr);
  if (isValid(date)) return date;
  
  // Try common sheet formats
  const formats = ['dd/MM/yyyy', 'd/M/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
  for (const fmt of formats) {
    try {
      date = parse(dateStr, fmt, new Date());
      if (isValid(date)) return date;
    } catch (e) {
      // Continue to next format
    }
  }
  return null;
}

const COLORS = ['#0a6c45', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

function DashboardView({ stats }: { stats: any }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tareas Terminadas</p>
          <h3 className="text-4xl font-black text-slate-800">{stats.completed}</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2">{Math.round((stats.completed/stats.total)*100) || 0}% del total</p>
        </div>
        
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tareas Vencidas</p>
          <h3 className="text-4xl font-black text-red-500">{stats.overdue}</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2">Requieren atención</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
            <Clock size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tiempo Ejecu. Promedio</p>
          <h3 className="text-4xl font-black text-slate-800">{stats.avgExecutionTime} <span className="text-sm font-bold text-slate-400">días</span></h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2">Días desde asignación</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Tareas</p>
          <h3 className="text-4xl font-black text-slate-800">{stats.total}</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-2">Seguimiento Global</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand/5 text-brand rounded-xl">
              <PieIcon size={20} />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase">Estado de la Operación</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 'bold' }} 
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-brand/5 text-brand rounded-xl">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-800 uppercase">Tareas por Responsable</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.tasksByManager}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 'bold' }} 
                />
                <Bar 
                  dataKey="value" 
                  fill="#0a6c45" 
                  radius={[10, 10, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTaskType, setFilterTaskType] = useState<string>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [currentCategory, setCurrentCategory] = useState<'all' | 'assigned' | 'overdue' | 'dashboard' | 'managed'>('all');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ type: 'overdue' | 'near', count: number } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState<Partial<Task>>({
    status: TaskStatus.PENDIENTE_ASIGNACION,
    assignmentDate: format(new Date(), 'yyyy-MM-dd'),
    commitmentDate: '',
  });

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  // Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('user_session', JSON.stringify(data.user));
      } else {
        setLoginError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setLoginError('Error de conexión');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, newPassword: passwordData.newPassword }),
      });
      if (res.ok) {
        alert('Contraseña actualizada correctamente');
        setIsChangingPassword(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      alert('Error al cambiar la contraseña');
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [tasksRes, managersRes] = await Promise.all([
        fetch(`/api/tasks?email=${user.email}&role=${user.role}`),
        fetch('/api/managers')
      ]);
      
      const tasksData = await tasksRes.json();
      const managersData = await managersRes.json();
      
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      }
      if (Array.isArray(managersData)) {
        setManagers(managersData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.TERMINADO);
    const completed = completedTasks.length;
    const pending = total - completed;
    
    // Status Distribution for Pie Chart
    const statusCounts: Record<string, number> = {};
    tasks.forEach(t => {
      const s = t.status || 'Sin estado';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Tasks by Manager for Bar Chart
    const managerCounts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.assignedTo) {
        managerCounts[t.assignedTo] = (managerCounts[t.assignedTo] || 0) + 1;
      }
    });
    const tasksByManager = Object.entries(managerCounts)
      .map(([name, value]) => ({ 
        name: name.split('@')[0], // Use short name for chart
        fullName: name,
        value 
      }))
      .sort((a, b) => b.value - a.value);

    // Execution Times (days from assignment to management date if finished)
    const executionTimes = completedTasks.map(t => {
      const start = safeParseDate(t.assignmentDate);
      const end = safeParseDate(t.dueDate);
      if (start && end) {
        return Math.max(0, differenceInDays(end, start));
      }
      return null;
    }).filter(t => t !== null) as number[];

    const avgExecutionTime = executionTimes.length > 0 
      ? Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length) 
      : 0;

    const overdueList = tasks.filter(t => {
      const isComplete = t.status === TaskStatus.TERMINADO;
      if (isComplete || !t.commitmentDate) return false;
      const date = safeParseDate(t.commitmentDate);
      return date && isPast(date) && !isToday(date);
    });
    const overdue = overdueList.length;

    const nearExpirationList = tasks.filter(t => {
      const isComplete = t.status === TaskStatus.TERMINADO;
      if (isComplete || !t.commitmentDate) return false;
      const date = safeParseDate(t.commitmentDate);
      return date && isWithinInterval(date, { 
        start: new Date(), 
        end: addDays(new Date(), 2) 
      });
    });
    
    const nearExpiration = nearExpirationList.length;

    return { 
      total, 
      completed, 
      pending, 
      overdue, 
      nearExpiration,
      statusData,
      tasksByManager,
      avgExecutionTime
    };
  }, [tasks]);

  useEffect(() => {
    if (!isLoading) {
      if (stats.overdue > 0) {
        setActiveAlert({ type: 'overdue', count: stats.overdue });
      } else if (stats.nearExpiration > 0) {
        setActiveAlert({ type: 'near', count: stats.nearExpiration });
      } else {
        setActiveAlert(null);
      }
    }
  }, [stats.overdue, stats.nearExpiration, isLoading]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesManager = filterManager === 'all' || t.assignedTo === filterManager;
      const matchesType = filterTaskType === 'all' || t.taskType === filterTaskType;
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (t.observations && t.observations.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesCategory = true;
      if (currentCategory === 'assigned') {
        matchesCategory = t.status !== TaskStatus.TERMINADO;
      } else if (currentCategory === 'overdue') {
        const isComplete = t.status === TaskStatus.TERMINADO;
        if (isComplete || !t.commitmentDate) {
          matchesCategory = false;
        } else {
          const date = safeParseDate(t.commitmentDate);
          matchesCategory = !!(date && isPast(date) && !isToday(date));
        }
      } else if (currentCategory === 'managed') {
        matchesCategory = t.status === TaskStatus.TERMINADO;
      }

      return matchesManager && matchesType && matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const dateA = safeParseDate(a.commitmentDate || a.dueDate);
      const dateB = safeParseDate(b.commitmentDate || b.dueDate);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks, filterManager, filterTaskType, searchQuery, currentCategory]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToEdit) return;
    
    // Find original task to check for re-opening
    const originalTask = tasks.find(t => t.id === taskToEdit.id);
    
    try {
      const res = await fetch(`/api/tasks/${taskToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskToEdit,
          previousStatus: originalTask?.status
        }),
      });
      if (res.ok) {
        setIsEditingTask(false);
        setTaskToEdit(null);
        fetchTasks();
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const openEditTask = (task: Task) => {
    setTaskToEdit({ ...task });
    setIsEditingTask(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setIsAddingTask(false);
        setNewTask({
          status: TaskStatus.PENDIENTE_ASIGNACION,
          assignmentDate: format(new Date(), 'yyyy-MM-dd'),
        });
        fetchTasks();
      }
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[40px] p-8 md:p-10 shadow-2xl shadow-brand/10 border border-slate-100"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 mb-6">
              <CheckCircle2 className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2 uppercase">Bienvenido</h1>
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">VP Servicio y Operaciones</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-center block text-slate-400">Correo Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  type="email" 
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                  value={loginData.email}
                  onChange={e => setLoginData({...loginData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-center block text-slate-400">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                  value={loginData.password}
                  onChange={e => setLoginData({...loginData, password: e.target.value})}
                />
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-xs font-black text-center uppercase tracking-widest bg-red-50 py-3 rounded-xl border border-red-100">
                {loginError}
              </p>
            )}

            <button 
              disabled={isLoggingIn}
              type="submit"
              className="w-full py-5 bg-brand hover:bg-brand/90 text-white rounded-2xl font-black transition-all shadow-xl shadow-brand/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              {isLoggingIn ? 'Verificando...' : 'Entrar al Sistema'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-[40] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <CheckCircle2 className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-sm tracking-tight">Seguimientos</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-600"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50] lg:hidden"
            />
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-[280px] bg-white z-[60] flex flex-col lg:hidden border-r border-slate-100 shadow-2xl"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="text-white w-5 h-5" />
                  </div>
                  <span className="font-black text-sm tracking-tight text-brand">Seguimientos</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 px-2">Navegación</p>
                <div className="space-y-2">
                  {user.role === 'admin' && (
                    <NavItem 
                      label="Dashboard" 
                      icon={<BarChart3 size={18} />} 
                      active={currentCategory === 'dashboard'} 
                      onClick={() => { setCurrentCategory('dashboard'); setIsMobileMenuOpen(false); }}
                    />
                  )}
                  <NavItem 
                    label="Panel Principal" 
                    icon={<LayoutDashboard size={18} />} 
                    active={currentCategory === 'all'} 
                    onClick={() => { setCurrentCategory('all'); setIsMobileMenuOpen(false); }}
                  />
                  <NavItem 
                    label="Tareas Asignadas" 
                    icon={<CalendarIcon size={18} />} 
                    active={currentCategory === 'assigned'} 
                    onClick={() => { setCurrentCategory('assigned'); setIsMobileMenuOpen(false); }}
                  />
                  <NavItem 
                    label="Tareas Gestionadas" 
                    icon={<CheckCircle2 size={18} />} 
                    active={currentCategory === 'managed'} 
                    onClick={() => { setCurrentCategory('managed'); setIsMobileMenuOpen(false); }}
                  />
                  <NavItem 
                    label="Tareas Vencidas" 
                    icon={<AlertTriangle size={18} />} 
                    active={currentCategory === 'overdue'} 
                    badge={stats.overdue}
                    onClick={() => { setCurrentCategory('overdue'); setIsMobileMenuOpen(false); }}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-50">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt={user.name} referrerPolicy="no-referrer" className="rounded-xl" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.role}</p>
                    </div>
                  </div>
                  <button onClick={() => { setIsChangingPassword(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 text-brand text-[9px] font-black uppercase tracking-widest">
                    <KeyRound size={14} />
                    <span>Contraseña</span>
                  </button>
                  <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 text-xs font-black uppercase tracking-widest mt-2">
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/10">
              <CheckCircle2 className="text-white w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-lg block leading-none tracking-tight">Seguimientos</span>
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest text-wrap">VP Servicio y Operaciones</span>
            </div>
          </div>

          <nav className="space-y-2">
            {user.role === 'admin' && (
              <NavItem 
                icon={<BarChart3 size={20} />} 
                label="Dashboard" 
                active={currentCategory === 'dashboard'} 
                onClick={() => setCurrentCategory('dashboard')}
              />
            )}
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Panel Principal" 
              active={currentCategory === 'all'} 
              onClick={() => setCurrentCategory('all')}
            />
            <NavItem 
              icon={<CalendarIcon size={20} />} 
              label="Tareas Asignadas" 
              active={currentCategory === 'assigned'} 
              onClick={() => setCurrentCategory('assigned')}
            />
            <NavItem 
              icon={<CheckCircle2 size={20} />} 
              label="Gestionadas" 
              active={currentCategory === 'managed'} 
              onClick={() => setCurrentCategory('managed')}
            />
            <NavItem 
              icon={<AlertTriangle size={20} />} 
              label="Tareas Vencidas" 
              active={currentCategory === 'overdue'} 
              badge={stats.overdue}
              onClick={() => setCurrentCategory('overdue')}
            />
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-slate-100">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 p-0.5 border border-slate-200">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt={user.name} referrerPolicy="no-referrer" className="rounded-2xl" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{user.role}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-3 text-brand hover:text-brand/80 transition-all text-[10px] font-black uppercase tracking-widest w-full px-2"
            >
              <KeyRound size={14} />
              <span>Cambiar Contraseña</span>
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-red-500 transition-all text-xs font-black uppercase tracking-widest w-full px-2"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Urgent Alerts Banner */}
        <AnimatePresence>
          {activeAlert && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className={cn(
                "overflow-hidden rounded-[32px] border-2 shadow-sm",
                activeAlert.type === 'overdue' ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"
              )}
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm",
                    activeAlert.type === 'overdue' ? "bg-red-600 text-white" : "bg-orange-500 text-white"
                  )}>
                    <Bell className="animate-bounce" size={24} />
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-black text-xl tracking-tight mb-0.5",
                      activeAlert.type === 'overdue' ? "text-red-900" : "text-orange-900"
                    )}>
                      {activeAlert.type === 'overdue' ? 'Alertas Críticas' : 'Tareas Próximas'}
                    </h3>
                    <p className={cn(
                      "text-sm font-semibold",
                      activeAlert.type === 'overdue' ? "text-red-700/70" : "text-orange-700/70"
                    )}>
                      Tienes <span className="font-black underline">{activeAlert.count} {activeAlert.count === 1 ? 'tarea' : 'tareas'}</span> que {activeAlert.type === 'overdue' ? 'requieren atención urgente' : 'vencerán muy pronto'}.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setCurrentCategory(activeAlert.type === 'overdue' ? 'overdue' : 'assigned');
                    setActiveAlert(null);
                  }}
                  className="p-3 bg-white/40 hover:bg-white rounded-2xl transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600"
                >
                  <Search size={18} />
                  <span>Ver Tareas</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentCategory === 'dashboard' && user.role === 'admin' ? (
          <DashboardView stats={stats} />
        ) : (
          <>
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black mb-1.5 tracking-tight text-slate-800">
              {currentCategory === 'all' && "Panel Principal"}
              {currentCategory === 'assigned' && "Tareas Asignadas"}
              {currentCategory === 'managed' && "Tareas Gestionadas"}
              {currentCategory === 'overdue' && "Tareas Vencidas"}
            </h1>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <LayoutDashboard size={14} />
              <span>{format(new Date(), 'MMMM d, yyyy', { locale: es })}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
              <span className="text-brand">
                {currentCategory === 'managed' ? `${stats.completed} terminadas` : `${stats.pending} pendientes`}
              </span>
            </div>
          </div>
          {user.role === 'admin' && (
            <button 
              onClick={() => setIsAddingTask(true)}
              className="group bg-brand hover:bg-brand/90 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_8px_30px_rgba(10,108,69,0.2)] active:scale-95"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              Nueva Tarea
            </button>
          )}
        </header>

        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Stats Bento Area */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Total" 
              value={stats.total} 
              icon={<LayoutDashboard className="text-brand" size={24} />}
              color="brand"
            />
            <StatCard 
              label="Pendientes" 
              value={stats.pending} 
              icon={<Clock className="text-amber-600" size={24} />}
              color="amber"
            />
            <StatCard 
              label="En Alerta" 
              value={stats.nearExpiration} 
              icon={<AlertCircle className="text-orange-600" size={24} />}
              color="orange"
              showWarning={stats.nearExpiration > 0}
            />
            <StatCard 
              label="Vencidas" 
              value={stats.overdue} 
              icon={<AlertTriangle className="text-red-600" size={24} />}
              color="red"
              highlight={stats.overdue > 0}
            />
          </div>

          {/* Quick Info Card */}
          <div className="col-span-12 lg:col-span-4 bg-brand rounded-[32px] p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-colors animate-pulse" />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2 tracking-tight">Carga del Equipo</h3>
              <p className="text-accent text-xs font-semibold leading-relaxed mb-6">
                El 85% de las tareas críticas han sido resueltas esta semana.
              </p>
              
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent/80">Gestión de Tareas</span>
              <div className="h-1 w-24 bg-brand/50 rounded-full overflow-hidden">
                <div className="h-full bg-accent w-[85%]" />
              </div>
            </div>
          </div>
            </div>
            
            <button className="mt-8 bg-white/10 hover:bg-white/20 transition-all border border-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest self-start">
              Ver Detalle
            </button>
          </div>
        </div>

        {/* Board Search & Filter */}
        <div className="bg-white p-5 rounded-[32px] border border-slate-200 mb-8 flex flex-col xl:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar tareas..."
              className="w-full pl-12 pr-5 py-3 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter size={16} className="text-slate-400" />
              <select 
                className="bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white w-full md:w-48 cursor-pointer appearance-none text-slate-600"
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value)}
              >
                <option value="all">Filtro: Tipo</option>
                {Object.values(TaskType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {user.role === 'admin' && (
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Filter size={16} className="text-slate-400" />
                <select 
                  className="bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white w-full md:w-64 cursor-pointer appearance-none text-slate-600"
                  value={filterManager}
                  onChange={(e) => setFilterManager(e.target.value)}
                >
                  <option value="all">Socio/Gerente</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.email}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Task Board */}
        <div className="space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
              <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando tareas desde Sheets...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, idx) => (
                    <motion.div
                      key={`${task.title}-${idx}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05, type: 'spring', damping: 20 }}
                      layout
                      onClick={() => openEditTask(task)}
                      className="cursor-pointer"
                    >
                      <TaskCard task={task} managers={managers} />
                    </motion.div>
                ))
              ) : (
                <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircle2 className="text-slate-200 w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Sin resultados</h3>
                  <p className="text-slate-400 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">No hay tareas que coincidan con tus criterios de búsqueda o filtros actuales.</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
          </>
        )}
        </div>
      </main>

      {/* Add Task Overlay - Form implementation */}
      <AnimatePresence>
        {isAddingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingTask(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl p-0 relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-800">Nueva Tarea</h2>
                  <p className="text-slate-400 text-sm font-semibold">Completa los datos para registrar en Google Sheets.</p>
                </div>
                <button 
                  onClick={() => setIsAddingTask(false)}
                  className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Título de la Tarea</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ej: Revisión Financiera"
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                      value={newTask.title || ''}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Responsable</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 appearance-none"
                      value={newTask.assignedTo || ''}
                      onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                    >
                      <option value="">Seleccionar responsable...</option>
                      {managers.map(m => <option key={m.id} value={m.email}>{m.name} ({m.email})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Fecha de Asignación</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                      value={newTask.assignmentDate || ''}
                      onChange={e => setNewTask({...newTask, assignmentDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Fecha de Compromiso</label>
                    <input 
                      type="date" 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                      value={newTask.commitmentDate || ''}
                      onChange={e => setNewTask({...newTask, commitmentDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Estado Inicial</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 appearance-none"
                      value={newTask.status || ''}
                      onChange={e => setNewTask({...newTask, status: e.target.value as TaskStatus})}
                    >
                      {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo de Tarea</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 appearance-none"
                      value={newTask.taskType || ''}
                      onChange={e => setNewTask({...newTask, taskType: e.target.value as TaskType})}
                    >
                      <option value="">Seleccione tipo...</option>
                      {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Observaciones</label>
                  <textarea 
                    rows={3}
                    placeholder="Detalles adicionales de la tarea..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 resize-none"
                    value={newTask.observations || ''}
                    onChange={e => setNewTask({...newTask, observations: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 justify-end pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsAddingTask(false)} 
                    className="px-10 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit"
                    className="px-10 py-4 rounded-2xl font-black bg-brand text-white hover:bg-brand/90 transition-all shadow-xl shadow-brand/10 flex items-center gap-3 active:scale-95 uppercase tracking-widest text-xs"
                  >
                    <Send size={18} />
                    Guardar en Sheets
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Overlay */}
      <AnimatePresence>
        {isEditingTask && taskToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingTask(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white rounded-[40px] md:rounded-[48px] shadow-2xl w-full max-w-2xl p-0 relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">Gestionar Tarea</h2>
                  <p className="text-slate-400 text-xs md:sm font-semibold">
                    {user.role === 'admin' ? 'Edita los parámetros de la tarea.' : 'Actualiza el progreso y comentarios de tu tarea.'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsEditingTask(false)}
                  className="p-2 md:p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateTask} className="p-6 md:p-10 space-y-6 md:space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Título de la Tarea</label>
                    <input 
                      disabled={user.role !== 'admin'}
                      required
                      type="text" 
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 disabled:opacity-60"
                      value={taskToEdit.title}
                      onChange={e => setTaskToEdit({...taskToEdit, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Fecha Gestión</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                      value={taskToEdit.dueDate || ''}
                      onChange={e => setTaskToEdit({...taskToEdit, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tipo de Tarea</label>
                    <select 
                      disabled={user.role !== 'admin'}
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 appearance-none disabled:opacity-60"
                      value={taskToEdit.taskType || ''}
                      onChange={e => setTaskToEdit({...taskToEdit, taskType: e.target.value as TaskType})}
                    >
                      <option value="">Sin tipo</option>
                      {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Estado</label>
                    <select 
                      required
                      disabled={taskToEdit.status === TaskStatus.TERMINADO && user.role !== 'admin'}
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 appearance-none disabled:opacity-60"
                      value={taskToEdit.status}
                      onChange={e => setTaskToEdit({...taskToEdit, status: e.target.value as TaskStatus})}
                    >
                      {user.role === 'admin' ? (
                        Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)
                      ) : (
                        <>
                          <option value={TaskStatus.EN_CURSO}>{TaskStatus.EN_CURSO}</option>
                          <option value={TaskStatus.TERMINADO}>{TaskStatus.TERMINADO}</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Fecha Compromiso</label>
                     <input 
                       disabled={user.role !== 'admin'}
                       type="date" 
                       className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 disabled:opacity-60"
                       value={taskToEdit.commitmentDate || ''}
                       onChange={e => setTaskToEdit({...taskToEdit, commitmentDate: e.target.value})}
                     />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Observaciones de Gestión (Columna G)</label>
                  <textarea 
                    rows={3}
                    placeholder="Escribe tus observaciones aquí..."
                    className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 resize-none text-sm md:text-base"
                    value={taskToEdit.managerComments || ''}
                    onChange={e => setTaskToEdit({...taskToEdit, managerComments: e.target.value})}
                  />
                </div>

                {user.role === 'admin' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Observaciones Generales</label>
                    <textarea 
                      rows={3}
                      className="w-full px-5 md:px-6 py-3 md:py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700 resize-none text-sm md:text-base"
                      value={taskToEdit.observations || ''}
                      onChange={e => setTaskToEdit({...taskToEdit, observations: e.target.value})}
                    />
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 justify-end pt-4 md:pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsEditingTask(false)} 
                    className="w-full md:w-auto px-10 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="w-full md:w-auto px-10 py-4 rounded-2xl font-black bg-brand text-white hover:bg-brand/90 transition-all shadow-xl shadow-brand/10 flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest text-xs"
                  >
                    Actualizar Tarea
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangingPassword && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangingPassword(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-0 relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase">Cambiar Contraseña</h2>
                </div>
                <button 
                  onClick={() => setIsChangingPassword(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nueva Contraseña</label>
                  <input 
                    required
                    type="password" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Confirmar Contraseña</label>
                  <input 
                    required
                    type="password" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand transition-all font-bold text-slate-700"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <button 
                    type="button"
                    onClick={() => setIsChangingPassword(false)} 
                    className="px-6 py-3 rounded-xl font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 rounded-xl font-black bg-brand text-white hover:bg-brand/90 transition-all shadow-lg shadow-brand/10 uppercase tracking-widest text-[10px]"
                  >
                    Actualizar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, badge = 0, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: number, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-black transition-all group uppercase tracking-widest",
        active ? "bg-brand text-white shadow-lg shadow-brand/10" : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn(active ? "text-white" : "text-slate-300 group-hover:text-brand")}>
          {icon}
        </span>
        {label}
      </div>
      {badge > 0 && (
        <span className={cn(
          "text-[9px] px-2 py-0.5 rounded-full min-w-[18px] text-center font-black",
          active ? "bg-white text-brand" : "bg-red-500 text-white"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, icon, color, highlight = false, showWarning = false }: any) {
  const colorSchema: any = {
    brand: { bg: "bg-brand-light", icon: "text-brand", border: "border-brand-light" },
    amber: { bg: "bg-accent/20", icon: "text-[#d4b000]", border: "border-accent/30" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
    red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
  };

  const schema = colorSchema[color];

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }}
      className={cn(
        "p-6 rounded-[32px] border bg-white transition-all duration-300 shadow-sm",
        highlight ? "border-red-200 bg-red-50/10 shadow-[0_12px_40px_rgb(239,68,68,0.12)]" : "border-slate-100"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-4 rounded-2xl shadow-sm", schema.bg)}>
          {icon}
        </div>
        {showWarning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full animate-pulse border border-orange-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
            <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Alerta</span>
          </div>
        )}
      </div>
      <div>
        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</h4>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black tracking-tight text-slate-800">{value}</span>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Tareas</span>
        </div>
      </div>
    </motion.div>
  );
}

function TaskCard({ task, managers }: { task: Task, managers: Manager[] }) {
  const isComplete = task.status === TaskStatus.TERMINADO;
  const isAsignado = task.status === TaskStatus.ASIGNADO;
  
  const getManagerDisplayName = (idOrEmail: string) => {
    if (!idOrEmail) return "No asignado";
    const manager = managers.find(m => m.email === idOrEmail || m.name === idOrEmail || m.id === idOrEmail);
    return manager ? manager.name : idOrEmail;
  };
  
  const dueDate = safeParseDate(task.dueDate);
  const commitmentDate = safeParseDate(task.commitmentDate);
  const isOverdue = commitmentDate && isPast(commitmentDate) && !isToday(commitmentDate) && !isComplete;
  
  const daysDiff = commitmentDate ? differenceInDays(commitmentDate, new Date()) : null;
  
  // Custom Alert Logic: 2 days before, Day of (0 days), and Assigned status
  const isNear = !isComplete && daysDiff !== null && daysDiff >= 0 && daysDiff <= 2;
  const isTodayDue = !isComplete && commitmentDate && isToday(commitmentDate);

  const statusColors = {
    [TaskStatus.PENDIENTE_ASIGNACION]: "bg-slate-100 text-slate-600",
    [TaskStatus.ASIGNADO]: "bg-brand-light text-brand border border-brand/10",
    [TaskStatus.EN_CURSO]: "bg-accent/20 text-[#d4b000] border border-accent/30",
    [TaskStatus.TERMINADO]: "bg-green-50 text-green-600 border border-green-100",
  };

  return (
    <div className={cn(
      "group bg-white p-7 rounded-[40px] border transition-all duration-700 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center relative shadow-sm hover:shadow-[0_45px_70px_rgba(10,108,69,0.08)]",
      isOverdue ? "border-red-400 bg-red-50/30" : "border-slate-100 hover:border-brand/30",
      isComplete && "opacity-50 grayscale-[0.5]"
    )}>
      {/* Visual Status Indicator */}
      <div className={cn(
        "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 flex-shrink-0 mt-1 md:mt-0 shadow-sm",
        isComplete 
          ? "bg-green-500 border-green-500 text-white" 
          : isOverdue ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200" : "border-slate-100 bg-slate-50"
      )}>
        {isComplete ? <CheckCircle2 size={20} /> : isOverdue ? <AlertTriangle size={20} className="animate-pulse" /> : <Clock size={20} className="text-slate-300" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <h3 className={cn(
            "text-2xl font-black tracking-tight transition-all duration-500 leading-none",
            isComplete ? "line-through text-slate-300" : isOverdue ? "text-red-900" : "text-slate-800"
          )}>
            {task.title}
          </h3>
          {task.taskType && (
            <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.1em] bg-slate-900 text-white shadow-sm">
              {task.taskType}
            </span>
          )}
          <span className={cn("text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.1em] shadow-sm", statusColors[task.status])}>
            {task.status}
          </span>
          {isAsignado && !isComplete && (
            <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.1em] bg-blue-600 text-white shadow-md shadow-blue-100 flex items-center gap-1 animate-bounce">
              <Bell size={10} /> Alerta Enviada (Asignación)
            </span>
          )}
        </div>
        <p className={cn(
          "text-sm font-medium leading-relaxed mb-6 max-w-2xl",
          isComplete ? "text-slate-300" : "text-slate-500"
        )}>
          {task.observations || "Sin observaciones."}
        </p>
        
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 p-0.5 border border-slate-100 shadow-sm">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo}`} alt={task.assignedTo} className="w-full h-full object-cover rounded-2xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Responsable</span>
              <span className="text-xs font-black text-slate-700">{getManagerDisplayName(task.assignedTo)}</span>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border transition-colors",
            isOverdue ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-100" : 
            isTodayDue ? "bg-orange-600 text-white border-orange-600 animate-pulse" :
            isNear ? "bg-orange-50 text-orange-600 border-orange-100" : 
            "bg-brand/5 text-brand border-brand/10"
          )}>
            <CalendarIcon size={14} />
            <span>
              Compromiso: {task.commitmentDate ? task.commitmentDate : "Sin fecha"}
            </span>
          </div>

          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-100 bg-slate-50 text-slate-400 font-bold">
            <Clock size={14} />
            <span>
              Fecha Gestión: {dueDate ? format(dueDate, 'd MMM, yyyy', { locale: es }) : "Pendiente"}
            </span>
          </div>

          {task.managerComments && (
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-brand-light text-brand border border-brand/10">
               <span className="font-bold">Gerente:</span> "{task.managerComments}"
            </div>
          )}
        </div>
      </div>

      {/* Visual Indicator of Urgency */}
      {!isComplete && (isNear || isOverdue || isTodayDue) && (
        <div className="flex md:flex-col items-center gap-3 text-center bg-slate-50 md:bg-transparent p-4 md:p-0 rounded-3xl md:rounded-none w-full md:w-auto">
           <motion.div 
            animate={{ scale: [1, 1.15, 1], rotate: isTodayDue ? [0, 10, -10, 0] : [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: isTodayDue ? 1.5 : 3 }}
            className={cn(
              "w-14 h-14 rounded-3xl flex items-center justify-center shadow-lg",
              isOverdue ? "bg-red-600 text-white shadow-red-200" : 
              isTodayDue ? "bg-orange-600 text-white shadow-orange-200" :
              "bg-orange-500 text-white shadow-orange-100"
            )}
           >
            <AlertCircle size={28} />
           </motion.div>
           <div className="flex flex-col items-start md:items-center">
             <span className={cn(
               "text-[10px] font-black uppercase tracking-[0.2em]",
               isOverdue ? "text-red-600" : "text-orange-600"
             )}>
               {isOverdue ? "Vencida" : isTodayDue ? "Expira Hoy" : "Próxima"}
             </span>
             <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
               {isOverdue ? "Acción Urgente" : `${daysInWords(daysDiff)}`}
             </span>
           </div>
        </div>
      )}
    </div>
  );
}

function daysInWords(days: number | null) {
  if (days === null) return "";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}
