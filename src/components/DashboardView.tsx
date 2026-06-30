import React, { useState } from 'react';
import { Patient, SchedulingRequest, ActivityLog, User } from '../types';
import { 
  Users, ClipboardList, CalendarCheck, CheckCircle, 
  Activity, ArrowRight, TrendingUp, Clock, FileText, ArrowUpRight,
  Search, Calendar, X, AlertCircle, Sparkles, HelpCircle
} from 'lucide-react';

interface DashboardViewProps {
  patients: Patient[];
  requests: SchedulingRequest[];
  logs: ActivityLog[];
  currentUser: User;
  onNavigateTo: (view: string) => void;
  onAddRequest?: (request: Omit<SchedulingRequest, 'id' | 'status' | 'requesterName'>) => void;
}

const CLINICAL_CATEGORIES = ['Saúde Coletiva', 'Hidroterapia', 'Ortopedia', 'Neuro Pediatria', 'Neuro Adulto'];

const getCategoryColorClass = (cat: string): string => {
  const c = cat.trim();
  if (c === 'Saúde Coletiva') return 'bg-indigo-50 text-indigo-800 border-indigo-100';
  if (c === 'Hidroterapia') return 'bg-cyan-50 text-cyan-800 border-cyan-100';
  if (c === 'Ortopedia') return 'bg-amber-50 text-amber-800 border-amber-100';
  if (c === 'Neuro Pediatria') return 'bg-purple-50 text-purple-800 border-purple-100';
  if (c === 'Neuro Adulto') return 'bg-emerald-50 text-emerald-800 border-emerald-100';
  return 'bg-slate-50 text-slate-800 border-slate-100';
};

const calculateAge = (dobString: string) => {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return `${age} anos`;
};

export default function DashboardView({ 
  patients, 
  requests, 
  logs, 
  currentUser, 
  onNavigateTo,
  onAddRequest 
}: DashboardViewProps) {
  
  // State for user dashboard scheduling modal
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Compute admin analytics
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'Ativo').length;
  const inServicePatients = patients.filter(p => p.status === 'Em Atendimento').length;
  const dischargedPatients = patients.filter(p => p.status === 'Alta').length;
  const pendingRequests = requests.filter(r => r.status === 'Pendente').length;

  const categories = CLINICAL_CATEGORIES;
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = patients.filter(p => p.category.split(',').map(s => s.trim()).includes(cat)).length;
    return acc;
  }, {} as Record<string, number>);

  // Compute category stats for admin (Em Atendimento vs Ainda Não Atendido)
  const categoryStats = categories.map(cat => {
    const categoryPatients = patients.filter(p => 
      p.status !== 'Alta' && 
      p.category.split(',').map(s => s.trim()).includes(cat)
    );

    const emAtendimentoCount = categoryPatients.filter(p => 
      requests.some(r => r.patientId === p.id && r.status === 'Marcado')
    ).length;

    const aindaNaoAtendidoCount = categoryPatients.length - emAtendimentoCount;

    return {
      category: cat,
      emAtendimento: emAtendimentoCount,
      aindaNaoAtendido: aindaNaoAtendidoCount,
      total: categoryPatients.length
    };
  });

  // Filters and Grouping for Clinical Users (Non-Admin Dashboard)
  const filteredPatients = patients.filter(p => {
    if (p.status === 'Alta') return false; // Non-admin only sees active/in-service patients
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.cpf.includes(searchQuery);
    return matchesSearch;
  });

  // Group filtered patients by category for the professional dashboard
  const groupedPatientsForUser = categories.map(cat => {
    const matching = filteredPatients.filter(p => 
      p.category.split(',').map(s => s.trim()).includes(cat)
    );
    return { category: cat, list: matching };
  }).filter(group => group.list.length > 0);

  // Collect other patients that don't match standard clinical categories
  const unclassifiedPatients = filteredPatients.filter(p => {
    const patientCats = p.category.split(',').map(s => s.trim());
    return !patientCats.some(cat => categories.includes(cat));
  });

  if (unclassifiedPatients.length > 0) {
    groupedPatientsForUser.push({ category: 'Outras Especialidades', list: unclassifiedPatients });
  }

  // Handle Scheduling Request Submission
  const handleOpenScheduleModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setRequestedDate('');
    setRequestedTime('');
    setReason('');
    setFormError('');
    setIsSuccess(false);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!requestedDate || !requestedTime || !reason.trim()) {
      setFormError('Por favor, preencha todos os campos para solicitar o agendamento.');
      return;
    }

    if (selectedPatient && onAddRequest) {
      onAddRequest({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        requestedDate,
        requestedTime,
        reason: reason.trim()
      });

      setIsSuccess(true);
      setTimeout(() => {
        setSelectedPatient(null);
        setIsSuccess(false);
      }, 2000);
    }
  };

  const recentLogs = [...logs].reverse().slice(0, 5);
  const recentPendingRequests = requests.filter(r => r.status === 'Pendente').slice(0, 3);

  // Render View based on role
  if (currentUser.role === 'admin') {
    return (
      <div className="space-y-6" id="admin-dashboard">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-rose-50/40 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-800 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                Administrador
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-medium">Painel Admin Ativo</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-2 tracking-tight animate-fade-in">
              Olá, {currentUser.name}!
            </h1>
            <p className="text-slate-500 text-xs mt-1 max-w-xl">
              Visualize o status em tempo real do Núcleo de Atendimento, controle usuários e aprove solicitações clínicas.
            </p>
          </div>
          <div className="flex shrink-0 space-x-2 relative z-10">
            <button
              onClick={() => onNavigateTo('patients')}
              className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
            >
              <span>Admitir Paciente</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Modern Compact KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total de Pacientes</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalPatients}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Cadastrados no Núcleo</p>
            </div>
            <div className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
              <Users className="h-5 w-5" />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pacientes Ativos</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {activePatients}
                <span className="text-xs text-slate-400 font-medium ml-1.5">({Math.round((activePatients / (totalPatients || 1)) * 100)}%)</span>
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Em acompanhamento ativo</p>
            </div>
            <div className="p-3 bg-emerald-50/50 text-emerald-700 rounded-xl border border-emerald-100">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Solicitações Pendentes</span>
              <h3 className="text-2xl font-black text-rose-800 mt-1">{pendingRequests}</h3>
              {pendingRequests > 0 ? (
                <button
                  onClick={() => onNavigateTo('scheduling')}
                  className="text-[10px] text-rose-700 font-bold hover:underline flex items-center mt-0.5"
                >
                  Gerenciar pendências <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              ) : (
                <p className="text-[10px] text-slate-500 mt-0.5">Tudo revisado</p>
              )}
            </div>
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Bento: Specialties and Pending Requests */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Bento Panel 1: Clean consolidated specialty table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Cuidado por Especialidade Clínica</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Distribuição do estado clínico por categoria</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                      <th className="pb-3 font-semibold">Especialidade / Categoria</th>
                      <th className="pb-3 font-semibold text-center">Em Atendimento</th>
                      <th className="pb-3 font-semibold text-center">Não Atendido</th>
                      <th className="pb-3 font-semibold text-right">Total Ativos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categoryStats.map((stat) => (
                      <tr key={stat.category} className="group hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 pr-2">
                          <span className="text-xs font-bold text-slate-700 block">{stat.category}</span>
                          <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden max-w-[140px]">
                            <div 
                              className="bg-rose-800 h-1.5 rounded-full" 
                              style={{ width: `${stat.total > 0 ? (stat.emAtendimento / stat.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg">
                            {stat.emAtendimento}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg">
                            {stat.aindaNaoAtendido}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-800 text-xs">
                          {stat.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bento Panel 2: Pending Scheduling Requests */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Solicitações de Agendamento</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Aguardando aprovação administrativa</p>
                </div>
                <button
                  onClick={() => onNavigateTo('scheduling')}
                  className="text-xs font-bold text-rose-800 hover:text-rose-950 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                >
                  Ver Todas
                </button>
              </div>

              {recentPendingRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recentPendingRequests.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-bold text-slate-800 truncate pr-1" title={req.patientName}>
                            {req.patientName}
                          </p>
                          <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          Por: <span className="font-semibold text-slate-500">{req.requesterName}</span>
                        </p>
                        
                        <p className="text-[11px] text-slate-500 bg-white/70 p-1.5 rounded border border-slate-100 mt-2.5 italic line-clamp-1">
                          "{req.reason}"
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{req.requestedDate}</span>
                        <span className="font-bold text-slate-600">{req.requestedTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CalendarCheck className="h-7 w-7 text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-500">Nenhum agendamento pendente</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Todos os pedidos foram processados.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Bento Column: Donut Breakdown + Timeline Activity Log */}
          <div className="space-y-6">
            
            {/* Bento Panel 3: Status Breakdown Circular Graph */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Status dos Prontuários</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Divisão geral por estado clínico</p>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="50" 
                      fill="transparent" 
                      stroke="#10b981" 
                      strokeWidth="8" 
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - (activePatients / (totalPatients || 1)))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-800">{Math.round((activePatients / (totalPatients || 1)) * 100)}%</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Ativos</span>
                  </div>
                </div>

                {/* Minimal legend layout */}
                <div className="grid grid-cols-3 gap-2 mt-4 w-full text-center text-[10px]">
                  <div className="p-1 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="block font-bold text-emerald-800">{activePatients}</span>
                    <span className="text-slate-400 text-[9px]">Ativo</span>
                  </div>
                  <div className="p-1 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="block font-bold text-amber-800">{inServicePatients}</span>
                    <span className="text-slate-400 text-[9px]">Em Atend.</span>
                  </div>
                  <div className="p-1 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="block font-bold text-slate-700">{dischargedPatients}</span>
                    <span className="text-slate-400 text-[9px]">Altas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Panel 4: Clean Activity Timeline Feed */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
                  <h2 className="text-sm font-bold text-slate-800">Atividades Recentes</h2>
                  <span className="text-[10px] text-slate-400">Log do Sistema</span>
                </div>

                <div className="space-y-3.5 relative before:absolute before:inset-y-0.5 before:left-2 before:w-[1px] before:bg-slate-100">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 text-xs">
                      {/* Tiny bullet point on the vertical line */}
                      <div className="absolute left-1 top-1 w-2 h-2 rounded-full border border-white bg-rose-700"></div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{log.userName} • {log.userRole === 'admin' ? 'Admin' : 'Prof.'}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed font-medium">
                        {log.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                <span>Auditoria clínica ativa</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // PROFESSIONAL (NON-ADMIN) DASHBOARD
  return (
    <div className="space-y-6" id="user-dashboard">
      
      {/* Dynamic Welcome Banner - Super Clean & High Contrast, No numerical statistics */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-50/40 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
              {currentUser.specialty || 'Profissional de Saúde'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-medium">Painel Clínico</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Olá, {currentUser.name}!
          </h1>
          <p className="text-slate-500 text-xs mt-1 max-w-xl">
            Bem-vindo ao seu ambiente de prontuários. Pesquise e filtre os pacientes sob sua especialidade para solicitar agendamentos rápidos de horários.
          </p>
        </div>
        
        {/* Dynamic Contextual Action */}
        <div className="shrink-0 relative z-10 flex items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
          <Clock className="h-4.5 w-4.5 text-rose-800 mr-2 shrink-0" />
          <div className="text-left">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Acesso Rápido</p>
            <p className="text-[11px] font-extrabold text-slate-700 mt-1 leading-none">Agendamento por Horário</p>
          </div>
        </div>
      </div>

      {/* Elegant Header with Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-1 h-5 bg-rose-800 rounded-full"></span>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Prontuários Ativos por Categoria</h2>
        </div>
        
        <div className="relative max-w-md w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 focus:border-rose-300 focus:bg-white focus:outline-none rounded-lg transition-all text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grouped Clinical Category List */}
      {groupedPatientsForUser.length > 0 ? (
        <div className="space-y-8">
          {groupedPatientsForUser.map((group) => {
            const headerColorClass = getCategoryColorClass(group.category);
            return (
              <div key={group.category} className="space-y-4">
                {/* Specialty Section Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-1.5 h-5 bg-rose-800 rounded-full"></span>
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {group.category}
                    </h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${headerColorClass}`}>
                      {group.list.length} {group.list.length === 1 ? 'paciente' : 'pacientes'}
                    </span>
                  </div>
                </div>

                {/* Patient Cards Grid for this category */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.list.map((patient) => {
                    const ageStr = calculateAge(patient.birthDate);
                    const statusColor =
                      patient.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                      <div 
                        key={patient.id} 
                        className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Badge / Header row */}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex flex-wrap gap-1 max-w-[70%]">
                              {patient.category.split(',').map(cat => cat.trim()).filter(Boolean).map((cat, idx) => {
                                const colorClass = getCategoryColorClass(cat);
                                return (
                                  <span key={idx} className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${colorClass}`}>
                                    {cat}
                                  </span>
                                );
                              })}
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${statusColor}`}>
                              {patient.status}
                            </span>
                          </div>

                          {/* Patient Name */}
                          <h3 className="font-extrabold text-slate-800 text-sm md:text-base line-clamp-1">
                            {patient.name}
                          </h3>
                          
                          {/* Secondary Info */}
                          <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-1 font-mono">
                            CPF: {patient.cpf} • {ageStr}
                          </p>

                          <div className="mt-4 space-y-2 border-t border-slate-50 pt-3">
                            <p className="text-xs text-slate-600 line-clamp-2">
                              <span className="font-semibold text-slate-700">Diagnóstico:</span> {patient.diagnosis || 'Sem diagnóstico cadastrado'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Admitido em: {patient.admissionDate}
                            </p>
                          </div>
                        </div>

                        {/* Schedule Request Action Button */}
                        <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-end">
                          <button
                            onClick={() => handleOpenScheduleModal(patient)}
                            className="w-full text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-emerald-100"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Solicitar Agendamento por Horário</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-sm">
          <ClipboardList className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">Nenhum prontuário encontrado</p>
          <p className="text-xs text-slate-400 max-w-[320px] mt-1">Nenhum prontuário ativo corresponde aos termos de pesquisa ou especialidades clínicas.</p>
        </div>
      )}

      {/* QUICK SCHEDULING MODAL / DIALOG */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden relative animate-fade-in">
            
            {/* Success Overlay state */}
            {isSuccess ? (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-center p-6 z-10">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 animate-bounce" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Agendamento Solicitado!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Sua solicitação de horário para <strong className="text-slate-700">{selectedPatient.name}</strong> foi gerada com sucesso e está sob aprovação administrativa.
                </p>
              </div>
            ) : null}

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Solicitar Horário</h3>
                  <h4 className="text-sm font-extrabold text-slate-800 mt-1.5 leading-none">Agendamento Clínico</h4>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleScheduleSubmit} className="p-5 space-y-4">
              
              {/* Patient Info Header card inside modal */}
              <div className="p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl">
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Paciente Selecionado</p>
                <p className="text-xs font-extrabold text-slate-800 mt-1">{selectedPatient.name}</p>
                <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-500">
                  <span className="font-mono">CPF: {selectedPatient.cpf}</span>
                  <span>•</span>
                  <span>Especialidade: {selectedPatient.category}</span>
                </div>
              </div>

              {/* Time and Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Sugerida</label>
                  <input
                    type="date"
                    required
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-300 focus:outline-none focus:bg-white text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Horário</label>
                  <input
                    type="time"
                    required
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-300 focus:outline-none focus:bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Scheduling Reason */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Motivo do Agendamento / Observação</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva brevemente a finalidade da sessão (Ex: Reavaliação ortopédica, sessão de hidroterapia semanal...)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-300 focus:outline-none focus:bg-white text-slate-800 font-medium resize-none placeholder:text-slate-400"
                />
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex items-start space-x-1.5 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Confirmar Agendamento</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
