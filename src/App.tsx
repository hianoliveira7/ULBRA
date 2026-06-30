import React, { useState, useEffect } from 'react';
import { User, Patient, Student, Evolution, SchedulingRequest, ActivityLog } from './types';
import { 
  INITIAL_USERS, INITIAL_PATIENTS, INITIAL_STUDENTS, INITIAL_EVOLUTIONS, 
  INITIAL_SCHEDULING_REQUESTS, INITIAL_LOGS 
} from './data';
import { isSupabaseConfigured, SQL_SCHEMA } from './supabaseClient';
import { 
  fetchUsers, saveUser, deleteUser,
  fetchPatients, savePatient, deletePatient,
  fetchStudents, saveStudent, deleteStudent,
  fetchEvolutions, saveEvolution,
  fetchRequests, saveRequest,
  fetchLogs, saveLog
} from './supabaseService';

// Views
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import PatientsView from './components/PatientsView';
import SchedulingView from './components/SchedulingView';
import UsersView from './components/UsersView';
import StudentsView from './components/StudentsView';
import ReportView from './components/ReportView';

// Icons
import { 
  LayoutDashboard, Users, CalendarDays, ClipboardList, 
  UserCog, LogOut, Activity, Menu, X, Shield, Stethoscope,
  Database, Copy, Check, AlertTriangle, Loader2, GraduationCap
} from 'lucide-react';

export default function App() {
  // --- STATES & LOCAL STORAGE SYNCHRONIZATION ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('nac_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('nac_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('nac_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [evolutions, setEvolutions] = useState<Evolution[]>(() => {
    const saved = localStorage.getItem('nac_evolutions');
    return saved ? JSON.parse(saved) : INITIAL_EVOLUTIONS;
  });

  const [requests, setRequests] = useState<SchedulingRequest[]>(() => {
    const saved = localStorage.getItem('nac_requests');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULING_REQUESTS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('nac_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nac_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0] || null;
  });

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Supabase Database Connection States
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [tablesMissing, setTablesMissing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync to local storage (acts as fallback cache when offline/disconnected)
  useEffect(() => {
    localStorage.setItem('nac_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('nac_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('nac_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('nac_evolutions', JSON.stringify(evolutions));
  }, [evolutions]);

  useEffect(() => {
    localStorage.setItem('nac_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('nac_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nac_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('nac_current_user');
    }
  }, [currentUser]);

  // Load from Supabase on Mount
  useEffect(() => {
    loadFromSupabase();
  }, []);

  const loadFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingDb(true);
    setDbError(null);
    try {
      const usersRes = await fetchUsers();
      const patientsRes = await fetchPatients();
      const studentsRes = await fetchStudents();
      const evolutionsRes = await fetchEvolutions();
      const requestsRes = await fetchRequests();
      const logsRes = await fetchLogs();

      if (usersRes.tablesMissing || patientsRes.tablesMissing || studentsRes.tablesMissing || evolutionsRes.tablesMissing || requestsRes.tablesMissing || logsRes.tablesMissing) {
        setTablesMissing(true);
      } else {
        setTablesMissing(false);
      }

      setUsers(usersRes.data);
      setPatients(patientsRes.data);
      setStudents(studentsRes.data);
      setEvolutions(evolutionsRes.data);
      setRequests(requestsRes.data);
      setLogs(logsRes.data);
    } catch (err: any) {
      console.error("Erro ao carregar dados do Supabase:", err);
      setDbError(err.message || "Erro de conexão com o banco.");
    } finally {
      setIsLoadingDb(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  // --- HELPER LOG GENERATOR ---
  const addLog = async (user: User, actionType: string, description: string) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const newLog: ActivityLog = {
      id: `l_${Date.now()}`,
      timestamp: formattedDate,
      userName: user.name,
      userRole: user.role,
      actionType,
      description,
    };
    setLogs(prev => [newLog, ...prev]);
    await saveLog(newLog);
  };


  // --- ACTIONS HANDLERS ---
  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    await addLog(user, 'Login', `Profissional ${user.name} realizou login no sistema.`);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await addLog(currentUser, 'Logout', `Profissional ${currentUser.name} encerrou a sessão.`);
    }
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleAddPatient = async (patientData: Omit<Patient, 'id' | 'admissionDate'>) => {
    if (!currentUser) return;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newPatient: Patient = {
      ...patientData,
      id: `p_${Date.now()}`,
      admissionDate: dateStr,
    };

    setPatients(prev => [newPatient, ...prev]);
    await addLog(currentUser, 'Admissão', `Admitido novo paciente: ${newPatient.name} na categoria ${newPatient.category}.`);
    await savePatient(newPatient);
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    if (!currentUser) return;
    const newStudent: Student = {
      ...studentData,
      id: `s_${Date.now()}`,
    };

    setStudents(prev => [newStudent, ...prev]);
    await addLog(currentUser, 'Aluno', `Admitido novo aluno de estágio: ${newStudent.name} (${newStudent.internshipStage}).`);
    await saveStudent(newStudent);
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    if (!currentUser) return;
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    
    // Also, if the student name/stage changed, let's update patients associated with them!
    setPatients(prev => prev.map(p => {
      if (p.studentId === updatedStudent.id) {
        return {
          ...p,
          studentName: updatedStudent.name,
          internshipStage: updatedStudent.internshipStage
        };
      }
      return p;
    }));

    await addLog(currentUser, 'Aluno', `Alterados dados cadastrais do aluno de estágio: ${updatedStudent.name}.`);
    await saveStudent(updatedStudent);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!currentUser) return;
    const studentToDelete = students.find(s => s.id === studentId);
    if (!studentToDelete) return;

    setStudents(prev => prev.filter(s => s.id !== studentId));
    
    // Disassociate from patients
    setPatients(prev => prev.map(p => {
      if (p.studentId === studentId) {
        return {
          ...p,
          studentId: '',
          studentName: '',
          internshipStage: ''
        };
      }
      return p;
    }));

    await addLog(currentUser, 'Aluno', `Removido registro do aluno de estágio: ${studentToDelete.name}.`);
    await deleteStudent(studentId);
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    if (!currentUser) return;
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    await addLog(currentUser, 'Edição', `Alterados dados de prontuário cadastrais do paciente: ${updatedPatient.name}.`);
    await savePatient(updatedPatient);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!currentUser) return;
    const patientToDelete = patients.find(p => p.id === patientId);
    if (!patientToDelete) return;

    setPatients(prev => prev.filter(p => p.id !== patientId));
    // Also delete references to maintain database integrity
    setEvolutions(prev => prev.filter(e => e.patientId !== patientId));
    setRequests(prev => prev.filter(r => r.patientId !== patientId));

    await addLog(currentUser, 'Exclusão', `Excluído definitivamente prontuário clínico do paciente: ${patientToDelete.name}.`);
    await deletePatient(patientId);
  };

  const handleAddEvolution = async (patientId: string, description: string) => {
    if (!currentUser) return;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newEvolution: Evolution = {
      id: `e_${Date.now()}`,
      patientId,
      date: formattedDate,
      authorName: currentUser.name,
      authorSpecialty: currentUser.specialty,
      description,
    };

    setEvolutions(prev => [...prev, newEvolution]);
    
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      await addLog(currentUser, 'Evolução', `Registrado novo acompanhamento de evolução clínica para o paciente: ${patient.name}.`);
    }
    await saveEvolution(newEvolution);
  };

  const handleAddRequest = async (requestData: Omit<SchedulingRequest, 'id' | 'status' | 'requesterName'>) => {
    if (!currentUser) return;

    const newRequest: SchedulingRequest = {
      ...requestData,
      id: `sr_${Date.now()}`,
      status: 'Pendente',
      requesterName: currentUser.name,
    };

    setRequests(prev => [...prev, newRequest]);
    await addLog(currentUser, 'Agendamento', `Solicitado agendamento clínico para paciente ${newRequest.patientName} em ${newRequest.requestedDate} às ${newRequest.requestedTime}.`);
    await saveRequest(newRequest);
  };

  const handleUpdateRequestStatus = async (id: string, status: 'Marcado' | 'Não Marcado', feedback?: string) => {
    if (!currentUser) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let updatedReq: SchedulingRequest | null = null;
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        updatedReq = {
          ...r,
          status,
          feedback,
          actionDate: dateStr,
        };
        return updatedReq;
      }
      return r;
    }));

    const req = requests.find(r => r.id === id);
    if (req) {
      await addLog(currentUser, 'Agendamento', `${status} agendamento para o paciente ${req.patientName} solicitado por ${req.requesterName}.`);
    }

    if (updatedReq) {
      await saveRequest(updatedReq);
    }
  };

  const handleAddUser = async (userData: Omit<User, 'id' | 'active'> & { password?: string }) => {
    if (!currentUser) return;

    const newUser: User = {
      id: `u_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      specialty: userData.specialty,
      active: true,
    };

    setUsers(prev => [...prev, newUser]);
    await addLog(currentUser, 'Usuário', `Cadastrado novo perfil de usuário: ${newUser.name} como ${newUser.role === 'admin' ? 'Administrador' : `Profissional (${newUser.specialty})`}.`);
    await saveUser(newUser);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    setUsers(prev => prev.filter(u => u.id !== userId));
    await addLog(currentUser, 'Usuário', `Revogado acesso e excluído usuário do sistema: ${userToDelete.name}.`);
    await deleteUser(userId);
  };



  // --- VIEW RENDERING ---
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            patients={patients} 
            requests={requests} 
            logs={logs} 
            currentUser={currentUser} 
            onNavigateTo={setCurrentView} 
            onAddRequest={handleAddRequest}
          />
        );
      case 'patients':
        return (
          <PatientsView 
            patients={patients} 
            students={students}
            evolutions={evolutions} 
            currentUser={currentUser}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
            onDeletePatient={handleDeletePatient}
            onAddEvolution={handleAddEvolution}
          />
        );
      case 'students':
        return (
          <StudentsView 
            students={students}
            patients={patients}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        );
      case 'report':
        return (
          <ReportView 
            patients={patients} 
            students={students}
          />
        );
      case 'scheduling':
        return (
          <SchedulingView 
            requests={requests} 
            patients={patients} 
            currentUser={currentUser}
            onAddRequest={handleAddRequest}
            onUpdateRequestStatus={handleUpdateRequestStatus}
          />
        );
      case 'users':
        if (currentUser.role !== 'admin') {
          return (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-100 shadow">
              <Shield className="h-12 w-12 text-rose-800 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800">Acesso Restrito</h2>
              <p className="text-xs text-slate-500 mt-1">Sua conta atual não possui privilégios de administrador para gerenciar usuários.</p>
            </div>
          );
        }
        return (
          <UsersView 
            users={users} 
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      default:
        return <div className="text-slate-400 text-xs">Visualização não encontrada.</div>;
    }
  };

  // Sidebar navigation options
  const navigationItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, roles: ['admin', 'user'] },
    { id: 'patients', label: 'Pacientes & Prontuários', icon: ClipboardList, roles: ['admin', 'user'] },
    { id: 'students', label: 'Admissão de Alunos', icon: GraduationCap, roles: ['admin', 'user'] },
    { id: 'report', label: 'Relatório de Atendimentos', icon: LayoutDashboard, roles: ['admin', 'user'] },
    { id: 'scheduling', label: 'Agendamentos', icon: CalendarDays, roles: ['admin', 'user'] },
    { id: 'users', label: 'Controle Usuários', icon: UserCog, roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* --- TOP MOBILE BAR --- */}
      <header className="bg-red-950 text-white p-4 flex items-center justify-between shadow-md lg:hidden shrink-0">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-red-400" />
          <span className="font-extrabold text-sm tracking-wide">Prontuário do NAC</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Database indicator mobile */}
          <button 
            onClick={() => setIsDbModalOpen(true)}
            className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
              !isSupabaseConfigured
                ? 'bg-amber-900/30 text-amber-300 border-amber-800/50'
                : tablesMissing
                ? 'bg-red-900/30 text-red-300 border-red-800/50 animate-pulse'
                : 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50'
            }`}
            title="Conexão com Banco de Dados"
          >
            <Database className="h-4 w-4 shrink-0" />
          </button>

          <div className="text-right text-[10px]">
            <p className="font-bold">{currentUser.name}</p>
            <p className="text-red-300/70 capitalize">{currentUser.role === 'admin' ? 'Administrador' : 'Profissional'}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-red-200 hover:text-white focus:outline-none cursor-pointer"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        
        {/* --- LEFT SIDEBAR (Desktop & Overlay Mobile) --- */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-red-950 text-white p-5 flex flex-col justify-between border-r border-red-900 shadow-xl transition-transform duration-300 transform
            lg:relative lg:translate-x-0 lg:z-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Top Branding Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-red-900/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
                  <div className="w-4 h-4 bg-red-800 rotate-45"></div>
                </div>
                <div className="leading-tight">
                  <h1 className="text-white font-bold leading-tight tracking-tight text-base">
                    Prontuário
                    <span className="block text-[10px] font-normal opacity-70">Núcleo de Atendimento</span>
                  </h1>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-white/10 rounded text-red-200 hover:text-white lg:hidden cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Menus */}
            <nav className="space-y-1">
              <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-wider px-3 mb-2">Acessos</p>
              {navigationItems
                .filter(item => item.roles.includes(currentUser.role))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full px-3 py-2 text-xs font-bold rounded-lg flex items-center space-x-3 transition-all cursor-pointer
                        ${isActive 
                          ? 'bg-red-900/50 text-white shadow border border-red-800' 
                          : 'text-red-200/70 hover:bg-red-900/30 hover:text-white'
                        }
                      `}
                    >
                      {isActive && <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />}
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* Bottom Profile and Logout Section */}
          <div className="pt-6 border-t border-red-900/50 space-y-4">
            <div className="flex items-center space-x-3 px-1.5">
              <div className="h-10 w-10 rounded-full bg-red-800 flex items-center justify-center font-bold text-white border border-red-700 shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="leading-tight overflow-hidden text-xs">
                <p className="font-extrabold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-red-300/70 truncate font-semibold">
                  {currentUser.role === 'admin' ? 'Administrador' : currentUser.specialty}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-xs font-bold text-red-200/70 hover:bg-red-900/30 hover:text-white rounded-lg flex items-center space-x-3 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0 text-red-400" />
              <span>Sair do Sistema</span>
            </button>
          </div>

        </aside>

        {/* --- MAIN CENTRAL VIEWPORT --- */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Overlay to close sidebar on mobile */}
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)} 
              className="fixed inset-0 bg-gray-950/20 backdrop-blur-xs z-30 lg:hidden"
            ></div>
          )}

          {/* Desktop header indicator */}
          <div className="hidden lg:flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
            <div className="flex items-center space-x-1 text-xs text-gray-500 font-medium">
              <span>Núcleo de Atendimento à Comunidade</span>
              <span>/</span>
              <span className="capitalize text-red-800 font-bold">{currentView}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Database Status Button */}
              <button 
                onClick={() => setIsDbModalOpen(true)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  !isSupabaseConfigured
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : tablesMissing
                    ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 animate-pulse'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Database className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {!isSupabaseConfigured 
                    ? 'Modo Demo (Local)' 
                    : tablesMissing 
                    ? 'Tabelas Faltando' 
                    : 'Supabase Ativo'}
                </span>
              </button>

              <div className="text-right text-xs">
                <p className="font-extrabold text-gray-800">{currentUser.name}</p>
                <p className="text-[10px] text-red-800 font-bold capitalize">
                  {currentUser.role === 'admin' ? 'Diretor Clínico ADM' : `Profissional de Saúde • ${currentUser.specialty}`}
                </p>
              </div>
              <div className="h-9 w-9 bg-red-800 border border-red-700 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>

          {/* Animated/Rendered view content */}
          <div className="animate-fadeIn max-w-7xl mx-auto">
            {renderViewContent()}
          </div>
        </main>

      </div>

      {/* --- SUPABASE CONFIGURATION MODAL --- */}
      {isDbModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-5 bg-red-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Database className="h-5 w-5 text-red-400" />
                <div>
                  <h3 className="font-bold text-sm">Configuração do Banco de Dados</h3>
                  <p className="text-[10px] text-red-300">Integração com PostgreSQL (Supabase)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDbModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-red-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700">
              
              {/* Connection Status Panel */}
              <div className="p-4 rounded-xl border flex items-start space-x-3 bg-gray-50 border-gray-200">
                {!isSupabaseConfigured ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Modo de Demonstração Ativo (Local)</p>
                      <p className="text-gray-600 mt-1">
                        O aplicativo está utilizando o <strong>LocalStorage</strong> do navegador. Os dados são salvos localmente, mas serão limpos se você limpar o cache ou trocar de navegador.
                      </p>
                    </div>
                  </>
                ) : tablesMissing ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1">
                      <p className="font-bold text-red-900">Conectado ao Supabase, mas tabelas ausentes</p>
                      <p className="text-gray-600 mt-1">
                        A conexão com o Supabase foi detectada, mas as tabelas do sistema não existem no seu projeto. Por favor, execute o script SQL abaixo no editor SQL do seu Supabase para criá-las.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-emerald-950">Supabase Conectado & Ativo!</p>
                      <p className="text-gray-600 mt-1">
                        Sua aplicação está sincronizada em tempo real com seu banco de dados PostgreSQL. Todas as admissões, evoluções, agendamentos e logs estão salvos com segurança na nuvem.
                      </p>
                      <div className="mt-2 text-[10px] bg-white border border-gray-200 rounded px-2.5 py-1 font-mono text-gray-500 break-all">
                        URL: {(import.meta as any).env?.VITE_SUPABASE_URL}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Instructions on how to set up */}
              {!isSupabaseConfigured && (
                <div className="space-y-2">
                  <p className="font-bold text-gray-900 text-sm">Como conectar o seu próprio Supabase?</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <li>Acesse <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-red-700 hover:underline font-semibold">supabase.com</a> e crie uma conta gratuita.</li>
                    <li>Crie um novo projeto no Supabase.</li>
                    <li>No menu de Secrets do AI Studio, adicione as variáveis de ambiente:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-[10px] font-mono text-gray-500">
                        <li>VITE_SUPABASE_URL = (Sua URL de projeto do Supabase)</li>
                        <li>VITE_SUPABASE_ANON_KEY = (Sua chave anônima/anon public key)</li>
                      </ul>
                    </li>
                    <li>Copie o script SQL abaixo e execute-o no <strong>SQL Editor</strong> do seu painel do Supabase.</li>
                  </ol>
                </div>
              )}

              {/* SQL Schema Script Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900 text-sm">Script de Criação de Tabelas (SQL)</p>
                  <button
                    onClick={handleCopySql}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-bold transition-all border cursor-pointer ${
                      copied 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3 bg-gray-950 text-gray-300 rounded-xl font-mono text-[10px] overflow-x-auto max-h-56 leading-relaxed">
                    {SQL_SCHEMA}
                  </pre>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-gray-900 text-gray-400 text-[8px] rounded border border-gray-800 select-none">
                    PostgreSQL Dialect
                  </div>
                </div>
              </div>

              {/* Reload / Dynamic Test */}
              {isSupabaseConfigured && (
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button
                    onClick={loadFromSupabase}
                    disabled={isLoadingDb}
                    className="px-4 py-2 bg-red-800 hover:bg-red-900 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    {isLoadingDb ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <Database className="h-3.5 w-3.5" />
                        <span>Testar Conexão / Atualizar Dados</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
