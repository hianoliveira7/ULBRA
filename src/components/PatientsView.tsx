import React, { useState } from 'react';
import { Patient, Student, Evolution, User, PatientStatus, CLINICAL_CATEGORIES } from '../types';
import { 
  Search, Plus, Filter, User as UserIcon, Calendar, Phone, Mail, 
  MapPin, Clipboard, FileText, History, FileCheck, ArrowUpRight, 
  Trash2, Edit, X, Save, AlertTriangle, ChevronRight, CheckCircle2,
  Printer, ArrowLeft, Heart, Send, UserCheck
} from 'lucide-react';

export const getCategoryColorClass = (cat: string): string => {
  const c = cat.trim();
  if (c === 'Saúde Coletiva') return 'bg-indigo-50 text-indigo-800 border-indigo-100';
  if (c === 'Hidroterapia') return 'bg-cyan-50 text-cyan-800 border-cyan-100';
  if (c === 'Ortopedia') return 'bg-amber-50 text-amber-800 border-amber-100';
  if (c === 'Neuro Pediatria') return 'bg-purple-50 text-purple-800 border-purple-100';
  if (c === 'Neuro Adulto') return 'bg-emerald-50 text-emerald-800 border-emerald-100';
  return 'bg-slate-50 text-slate-800 border-slate-100';
};

interface PatientsViewProps {
  patients: Patient[];
  students: Student[];
  evolutions: Evolution[];
  currentUser: User;
  onAddPatient: (patient: Omit<Patient, 'id' | 'admissionDate'>) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  onAddEvolution: (patientId: string, description: string) => void;
}

export default function PatientsView({
  patients,
  students,
  evolutions,
  currentUser,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onAddEvolution,
}: PatientsViewProps) {
  // Views state: 'list' | 'create' | 'details' | 'edit'
  const [viewState, setViewState] = useState<'list' | 'create' | 'details'>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Tab within details view
  const [activeDetailsTab, setActiveDetailsTab] = useState<'info' | 'history' | 'evolutions'>('info');

  // Search and Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Add Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    birthDate: '',
    address: '',
    category: 'Saúde Coletiva',
    diagnosis: '',
    status: 'Ativo' as PatientStatus,
    reasonForConsultation: '',
    clinicalHistory: '',
    observations: '',
    studentId: '',
    studentName: '',
    internshipStage: '',
  });

  // Edit Patient Form State
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Add Evolution Form State
  const [evolutionText, setEvolutionText] = useState('');
  const [evolutionError, setEvolutionError] = useState('');

  // Report Modal State (PDF Print representation)
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Filter implementation
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchText.toLowerCase()) ||
      patient.cpf.includes(searchText) ||
      patient.diagnosis.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || patient.category.split(',').map(s => s.trim()).includes(selectedCategory);
    const matchesStatus = selectedStatus === 'all' || patient.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group filtered patients by category / specialty
  const groupedPatients = CLINICAL_CATEGORIES.map(category => {
    const matching = filteredPatients.filter(p => 
      p.category.split(',').map(s => s.trim()).includes(category)
    );
    return { category, patients: matching };
  }).filter(group => group.patients.length > 0);

  // Collect any patient that has no categories matching CLINICAL_CATEGORIES
  const otherPatients = filteredPatients.filter(p => {
    const patientCats = p.category.split(',').map(s => s.trim());
    return !patientCats.some(cat => CLINICAL_CATEGORIES.includes(cat));
  });

  if (otherPatients.length > 0) {
    groupedPatients.push({ category: 'Outras Especialidades', patients: otherPatients });
  }

  // Calculate age helper
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPatient(newPatient);
    setViewState('list');
    // Reset form
    setNewPatient({
      name: '',
      cpf: '',
      phone: '',
      email: '',
      birthDate: '',
      address: '',
      category: 'Saúde Coletiva',
      diagnosis: '',
      status: 'Ativo',
      reasonForConsultation: '',
      clinicalHistory: '',
      observations: '',
      studentName: '',
      internshipStage: '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      onUpdatePatient(editingPatient);
      setSelectedPatient(editingPatient);
      setViewState('details');
      setEditingPatient(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente este prontuário? Esta ação não pode ser desfeita.')) {
      onDeletePatient(id);
      setViewState('list');
      setSelectedPatient(null);
    }
  };

  const handleAddEvolutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEvolutionError('');
    if (!evolutionText.trim()) {
      setEvolutionError('A descrição da evolução clínica não pode estar vazia.');
      return;
    }
    if (selectedPatient) {
      onAddEvolution(selectedPatient.id, evolutionText);
      setEvolutionText('');
    }
  };

  // Filter elements
  const patientEvolutions = selectedPatient 
    ? evolutions.filter(ev => ev.patientId === selectedPatient.id).sort((a,b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Prontuários de Pacientes</h1>
          <p className="text-xs text-slate-500 mt-1">
            {viewState === 'list' && 'Consulte, filtre ou admita pacientes no núcleo de atendimento.'}
            {viewState === 'create' && 'Admissão e abertura de prontuário clínico de novo paciente.'}
            {viewState === 'details' && `Histórico e evolução clínica do paciente: ${selectedPatient?.name}`}
          </p>
        </div>

        {viewState === 'list' && (
          <div className="shrink-0">
            <button
              onClick={() => setViewState('create')}
              className="w-full sm:w-auto px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white font-medium text-xs md:text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Admitir Novo Paciente</span>
            </button>
          </div>
        )}

        {viewState !== 'list' && (
          <button
            onClick={() => {
              setViewState('list');
              setSelectedPatient(null);
              setEditingPatient(null);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs md:text-sm rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para Lista</span>
          </button>
        )}
      </div>

      {/* ======================= LIST VIEW ======================= */}
      {viewState === 'list' && (
        <div className="space-y-4">
          
          {/* SEARCH & FILTER TOOLBAR */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou diagnóstico..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white font-semibold"
              >
                <option value="all">Todas as Especialidades</option>
                <option value="Saúde Coletiva">Saúde Coletiva</option>
                <option value="Hidroterapia">Hidroterapia</option>
                <option value="Ortopedia">Ortopedia</option>
                <option value="Neuro Pediatria">Neuro Pediatria</option>
                <option value="Neuro Adulto">Neuro Adulto</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white font-semibold"
              >
                <option value="all">Todos os Status</option>
                <option value="Ativo">Status: Ativo</option>
                <option value="Alta">Status: Alta</option>
                <option value="Em Atendimento">Status: Em Atendimento</option>
              </select>
            </div>
          </div>

          {/* PATIENT LIST TABLE/GRID */}
          {filteredPatients.length > 0 ? (
            <div className="space-y-8">
              {groupedPatients.map((group) => {
                const headerColorClass = getCategoryColorClass(group.category);
                return (
                  <div key={group.category} className="space-y-4">
                    {/* Specialty Section Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-1.5 h-6 bg-rose-800 rounded-full"></span>
                        <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                          {group.category}
                        </h2>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${headerColorClass}`}>
                          {group.patients.length} {group.patients.length === 1 ? 'paciente' : 'pacientes'}
                        </span>
                      </div>
                    </div>

                    {/* Patients Grid for this Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {group.patients.map((patient) => {
                        const ageStr = calculateAge(patient.birthDate);
                        const statusColor =
                          patient.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' :
                          patient.status === 'Alta' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          'bg-amber-50 text-amber-700 border-amber-200';

                        return (
                          <div 
                            key={patient.id} 
                            className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-rose-100 transition-all flex flex-col justify-between"
                          >
                            <div>
                              {/* Badge / Header row */}
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex flex-wrap gap-1 max-w-[70%]">
                                  {patient.category.split(',').map(cat => cat.trim()).filter(Boolean).map((cat, idx) => {
                                    const colorClass = getCategoryColorClass(cat);
                                    return (
                                      <span key={idx} className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${colorClass}`}>
                                        {cat}
                                      </span>
                                    );
                                  })}
                                </div>
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${statusColor}`}>
                                  {patient.status}
                                </span>
                              </div>

                              {/* Patient Name */}
                              <h3 className="font-bold text-slate-800 text-base line-clamp-1 hover:text-rose-800 transition-colors">
                                {patient.name}
                              </h3>
                              
                              {/* Secondary Info */}
                              <p className="text-xs text-slate-500 font-medium mt-1 font-mono">
                                CPF: {patient.cpf} • {ageStr}
                              </p>

                              <div className="mt-4 space-y-2 border-t border-slate-50 pt-3">
                                <p className="text-xs text-slate-600 line-clamp-2">
                                  <span className="font-semibold text-slate-700">Diagnóstico:</span> {patient.diagnosis}
                                </p>
                                {patient.studentName && (
                                  <p className="text-[11px] text-slate-600 font-medium">
                                    <span className="text-slate-400">Acadêmico:</span> {patient.studentName}
                                  </p>
                                )}
                                {patient.internshipStage && (
                                  <p className="text-[11px] text-slate-600 font-medium -mt-1">
                                    <span className="text-slate-400">Estágio:</span> {patient.internshipStage}
                                  </p>
                                )}
                                <p className="text-[11px] text-slate-400">
                                  Admitido em: {patient.admissionDate}
                                </p>
                              </div>
                            </div>

                            {/* Action button row */}
                            <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                              <button
                                onClick={() => handleDeleteClick(patient.id)}
                                className="text-xs text-rose-700 hover:text-rose-950 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-all cursor-pointer font-bold border border-transparent hover:border-rose-100"
                                title="Excluir Prontuário"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Excluir</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setViewState('details');
                                }}
                                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
                              >
                                <span>Acessar Prontuário</span>
                                <ChevronRight className="h-3.5 w-3.5" />
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
            <div className="bg-white p-12 text-center rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <UserIcon className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">Nenhum paciente encontrado</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Revise os termos da busca ou os filtros de status e categoria. Você pode admitir um novo paciente.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ======================= ADMISSION FORM (CREATE) ======================= */}
      {viewState === 'create' && (
        <form onSubmit={handleCreateSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 bg-rose-50/20">
            <h2 className="text-base font-bold text-rose-950 flex items-center space-x-2">
              <Clipboard className="h-5 w-5 text-rose-800" />
              <span>Abertura de Prontuário Clínico (Admissão)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Preencha todos os dados iniciais do paciente com cautela.</p>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Section 1: Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5">1. Dados de Identificação</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo do Paciente *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: João da Silva Santos"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 123.456.789-00"
                    value={newPatient.cpf}
                    onChange={(e) => setNewPatient({ ...newPatient, cpf: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    value={newPatient.birthDate}
                    onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: (11) 98765-4321"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="ex: paciente@email.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Residencial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Section: Aluno Responsável */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-rose-800 uppercase tracking-widest border-b border-rose-100 pb-1.5 flex items-center space-x-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-700"></span>
                <span>Responsável pela Admissão (Aluno de Estágio)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selecionar Aluno Cadastrado</label>
                  <select
                    value={newPatient.studentId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId === '') {
                        setNewPatient({ ...newPatient, studentId: '', studentName: '', internshipStage: '' });
                      } else {
                        const s = students.find(std => std.id === selectedId);
                        if (s) {
                          setNewPatient({ 
                            ...newPatient, 
                            studentId: s.id, 
                            studentName: s.name, 
                            internshipStage: s.internshipStage 
                          });
                        } else if (selectedId === 'custom') {
                          setNewPatient({ ...newPatient, studentId: 'custom' });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800 font-semibold"
                  >
                    <option value="">-- Escolha um Aluno Cadastrado --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.internshipStage})</option>
                    ))}
                    <option value="custom">-- Digitar Aluno Manualmente --</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo do Aluno *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do aluno que realizou a admissão"
                    value={newPatient.studentName}
                    onChange={(e) => setNewPatient({ ...newPatient, studentName: e.target.value, studentId: newPatient.studentId === 'custom' ? 'custom' : '' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estágio / Período / Setor *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Fisioterapia Neurofuncional II (8º Período)"
                    value={newPatient.internshipStage}
                    onChange={(e) => setNewPatient({ ...newPatient, internshipStage: e.target.value, studentId: newPatient.studentId === 'custom' ? 'custom' : '' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Para um controle completo de escalas e prontuários por aluno, prefira cadastrar o acadêmico previamente na aba <strong>Admissão de Alunos</strong>.
              </p>
            </div>

            {/* Section 2: Especialidade e Diagnóstico Clínico */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5">2. Encaminhamento & Triagem</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Especialidades / Categorias *</label>
                  <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {CLINICAL_CATEGORIES.map(cat => {
                      const selectedCats = newPatient.category ? newPatient.category.split(',').map(s => s.trim()) : [];
                      const isChecked = selectedCats.includes(cat);
                      return (
                        <label key={cat} className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer hover:text-rose-900">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let nextCats;
                              if (e.target.checked) {
                                nextCats = [...selectedCats.filter(c => c !== cat), cat];
                              } else {
                                nextCats = selectedCats.filter(c => c !== cat);
                              }
                              setNewPatient({ ...newPatient, category: nextCats.join(', ') });
                            }}
                            className="rounded border-slate-300 text-rose-800 focus:ring-rose-500 h-3.5 w-3.5"
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                  {(!newPatient.category || newPatient.category.trim() === '') && (
                    <p className="text-[10px] text-rose-700 mt-1">Selecione pelo menos uma categoria.</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hipótese Diagnóstica / Queixa Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Sequelas motoras pós-AVC / Transtorno ansioso a esclarecer"
                    value={newPatient.diagnosis}
                    onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Detalhes e Observações */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5">3. Observações Iniciais</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observações da Equipe de Triagem</label>
                  <textarea
                    rows={4}
                    placeholder="Fatores familiares, socioeconômicos, encaminhamentos, queixas ou antecedentes patológicos relevantes..."
                    value={newPatient.observations}
                    onChange={(e) => setNewPatient({ ...newPatient, observations: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  ></textarea>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => setViewState('list')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Confirmar Admissão & Criar Prontuário
            </button>
          </div>
        </form>
      )}

      {/* ======================= DETAILED VIEW (PRONTUÁRIO COMPLETO) ======================= */}
      {viewState === 'details' && selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left profile card & metadata */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between self-start">
            <div>
              {/* Category & Status Badges */}
              <div className="flex flex-col space-y-2 mb-4 w-full">
                {editingPatient ? (
                  <div className="flex flex-col space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Categorias *</span>
                    <div className="flex flex-col space-y-1">
                      {CLINICAL_CATEGORIES.map(cat => {
                        const selectedCats = editingPatient.category ? editingPatient.category.split(',').map(s => s.trim()) : [];
                        const isChecked = selectedCats.includes(cat);
                        return (
                          <label key={cat} className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let nextCats;
                                if (e.target.checked) {
                                  nextCats = [...selectedCats.filter(c => c !== cat), cat];
                                } else {
                                  nextCats = selectedCats.filter(c => c !== cat);
                                }
                                setEditingPatient({ ...editingPatient, category: nextCats.join(', ') });
                              }}
                              className="rounded border-slate-300 text-rose-800 focus:ring-rose-500 h-3 w-3"
                            />
                            <span>{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedPatient.category.split(',').map(cat => cat.trim()).filter(Boolean).map((cat, idx) => {
                      const colorClass = getCategoryColorClass(cat);
                      return (
                        <span key={idx} className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${colorClass}`}>
                          {cat}
                        </span>
                      );
                    })}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-1 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400">Status do Prontuário</span>
                  {/* Editable Status */}
                  {editingPatient ? (
                    <select
                      value={editingPatient.status}
                      onChange={(e) => setEditingPatient({ ...editingPatient, status: e.target.value as PatientStatus })}
                      className="py-1 px-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Alta">Alta</option>
                      <option value="Em Atendimento">Em Atendimento</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                      selectedPatient.status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' :
                      selectedPatient.status === 'Alta' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedPatient.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Main Info */}
              <div className="text-center py-4 border-b border-slate-50 mb-4">
                <div className="h-16 w-16 bg-rose-50 border border-rose-100 text-rose-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold uppercase mb-2">
                  {selectedPatient.name.charAt(0)}
                </div>
                {editingPatient ? (
                  <input
                    type="text"
                    required
                    value={editingPatient.name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                    className="text-center font-bold text-slate-800 text-lg w-full bg-slate-50 border border-slate-200 rounded p-1"
                  />
                ) : (
                  <h2 className="font-extrabold text-slate-800 text-lg">{selectedPatient.name}</h2>
                )}
                <p className="text-xs text-slate-400 font-mono mt-1">Reg. Interno: #{selectedPatient.id.toUpperCase()}</p>
              </div>

              {/* Patient Basic Fields */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start space-x-2.5">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Documento CPF</p>
                    {editingPatient ? (
                      <input
                        type="text"
                        value={editingPatient.cpf}
                        onChange={(e) => setEditingPatient({ ...editingPatient, cpf: e.target.value })}
                        className="font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded p-0.5 w-full mt-0.5"
                      />
                    ) : (
                      <p className="font-medium text-slate-800 font-mono">{selectedPatient.cpf}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Nascimento / Idade</p>
                    {editingPatient ? (
                      <input
                        type="date"
                        value={editingPatient.birthDate}
                        onChange={(e) => setEditingPatient({ ...editingPatient, birthDate: e.target.value })}
                        className="font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded p-0.5 w-full mt-0.5"
                      />
                    ) : (
                      <p className="font-medium text-slate-800">
                        {selectedPatient.birthDate} ({calculateAge(selectedPatient.birthDate)})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Telefone para Contato</p>
                    {editingPatient ? (
                      <input
                        type="text"
                        value={editingPatient.phone}
                        onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                        className="font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded p-0.5 w-full mt-0.5"
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{selectedPatient.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">E-mail</p>
                    {editingPatient ? (
                      <input
                        type="email"
                        value={editingPatient.email}
                        onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                        className="font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded p-0.5 w-full mt-0.5"
                      />
                    ) : (
                      <p className="font-medium text-slate-800 text-slate-700 break-all">{selectedPatient.email || 'Não informado'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Endereço</p>
                    {editingPatient ? (
                      <textarea
                        rows={2}
                        value={editingPatient.address}
                        onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                        className="font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded p-0.5 w-full mt-0.5 text-xs"
                      ></textarea>
                    ) : (
                      <p className="font-medium text-slate-800 leading-relaxed text-slate-700">{selectedPatient.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Controls on Patient details */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
              
              {/* PRINT / GEN REPORT BUTTON (Accessible by ALL roles as clinical differentiation!) */}
              <button
                onClick={() => setReportModalOpen(true)}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-100 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Gerar Relatório Clínico</span>
              </button>

              {editingPatient ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleEditSubmit}
                    className="py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvar</span>
                  </button>
                  <button
                    onClick={() => setEditingPatient(null)}
                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancelar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingPatient(selectedPatient)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar Cadastro</span>
                </button>
              )}

              <button
                onClick={() => handleDeleteClick(selectedPatient.id)}
                className="w-full py-2 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-rose-700 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Prontuário</span>
              </button>
            </div>
          </div>

          {/* Right Main Panel: Observações Clínicas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
              
              {/* Seção de Clínica Escola (Aluno & Estágio) */}
              <div className="bg-rose-50/30 p-4 rounded-xl border border-rose-100/60">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-widest border-b border-rose-100/60 pb-2 flex items-center space-x-2">
                  <span className="p-1 bg-rose-100 rounded text-rose-800">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <span>Responsável Acadêmico (Clínica-Escola)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  {editingPatient ? (
                    <>
                      <div className="md:col-span-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Vincular Aluno Cadastrado</p>
                        <select
                          value={editingPatient.studentId || ''}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId === '') {
                              setEditingPatient({ ...editingPatient, studentId: '', studentName: '', internshipStage: '' });
                            } else {
                              const s = students.find(std => std.id === selectedId);
                              if (s) {
                                setEditingPatient({ 
                                  ...editingPatient, 
                                  studentId: s.id, 
                                  studentName: s.name, 
                                  internshipStage: s.internshipStage 
                                });
                              } else if (selectedId === 'custom') {
                                setEditingPatient({ ...editingPatient, studentId: 'custom' });
                              }
                            }
                          }}
                          className="mt-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded p-1.5 w-full text-xs focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">-- Escolha um Aluno Cadastrado --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.internshipStage})</option>
                          ))}
                          <option value="custom">-- Digitar Aluno Manualmente --</option>
                        </select>
                      </div>
                      
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Aluno Admissor *</p>
                        <input
                          type="text"
                          required
                          value={editingPatient.studentName || ''}
                          onChange={(e) => setEditingPatient({ ...editingPatient, studentName: e.target.value, studentId: editingPatient.studentId === 'custom' ? 'custom' : '' })}
                          className="mt-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded p-1.5 w-full text-xs"
                        />
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Estágio / Setor / Período *</p>
                        <input
                          type="text"
                          required
                          value={editingPatient.internshipStage || ''}
                          onChange={(e) => setEditingPatient({ ...editingPatient, internshipStage: e.target.value, studentId: editingPatient.studentId === 'custom' ? 'custom' : '' })}
                          className="mt-1 font-semibold text-slate-800 bg-white border border-slate-200 rounded p-1.5 w-full text-xs"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Vinculação Acadêmica</p>
                        <p className="font-semibold text-rose-850 text-xs mt-1">
                          {selectedPatient.studentId ? '✓ Aluno Credenciado' : '⚠ Registro Avulso/Manual'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Aluno Admissor</p>
                        <p className="font-bold text-slate-800 text-xs mt-1">
                          {selectedPatient.studentName || 'Não Informado'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Estágio / Setor / Período</p>
                        <p className="font-semibold text-slate-700 text-xs mt-1">
                          {selectedPatient.internshipStage || 'Não Informado'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-widest border-b border-rose-50 pb-2 flex items-center space-x-2">
                  <FileText className="h-4.5 w-4.5" />
                  <span>Hipótese Diagnóstica Ativa</span>
                </h3>
                {editingPatient ? (
                  <input
                    type="text"
                    required
                    value={editingPatient.diagnosis}
                    onChange={(e) => setEditingPatient({ ...editingPatient, diagnosis: e.target.value })}
                    className="mt-3 font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded p-2 w-full text-sm"
                  />
                ) : (
                  <p className="mt-3 text-slate-800 text-sm font-semibold p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    {selectedPatient.diagnosis}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-widest border-b border-rose-50 pb-2 flex items-center space-x-2">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <span>Observações do Prontuário</span>
                </h3>
                {editingPatient ? (
                  <textarea
                    rows={8}
                    value={editingPatient.observations}
                    onChange={(e) => setEditingPatient({ ...editingPatient, observations: e.target.value })}
                    className="mt-3 text-slate-800 text-xs bg-slate-50 border border-slate-200 rounded p-2.5 w-full leading-relaxed"
                  ></textarea>
                ) : (
                  <p className="mt-3 text-slate-600 text-xs leading-relaxed bg-white border border-slate-100 p-4 rounded-xl whitespace-pre-wrap">
                    {selectedPatient.observations || 'Nenhuma observação cadastrada.'}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================= REPORT PRINT PREVIEW MODAL ======================= */}
      {reportModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Controls */}
            <div className="p-4 bg-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="h-5 w-5 text-rose-300" />
                <span className="font-bold text-sm tracking-wide">Visualização de Impressão • Relatório Clínico</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg flex items-center space-x-1 shadow cursor-pointer"
                >
                  <Printer className="h-3 w-3" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-rose-200 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Area (Styled to look extremely official like a real hospital document) */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-0" id="clinical-report-printable">
              
              {/* Report Header logo */}
              <div className="border-b-4 border-rose-800 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-xl font-black text-rose-950 uppercase tracking-tight">NÚCLEO DE ATENDIMENTO À COMUNIDADE</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clínica Escola Integrada de Reabilitação e Saúde</p>
                  <p className="text-[9px] text-slate-400">Av. das Nações, 4500 • São Paulo - SP • CEP: 01000-000</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-bold text-[9px] rounded font-mono">
                    EMISSÃO: {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Patient Profile */}
              <div>
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-widest border-b border-slate-100 pb-1 mb-3">I. Dados Básicos do Assistido</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nome Completo</span>
                    <strong className="text-slate-900">{selectedPatient.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CPF</span>
                    <strong className="text-slate-900 font-mono">{selectedPatient.cpf}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data de Nascimento</span>
                    <strong className="text-slate-900">{selectedPatient.birthDate} ({calculateAge(selectedPatient.birthDate)})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data de Admissão</span>
                    <strong className="text-slate-900">{selectedPatient.admissionDate}</strong>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3.5 pt-3 border-t border-slate-50">
                  <div className="col-span-1">
                    <span className="text-slate-400 block text-[10px]">Especialidade</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPatient.category.split(',').map(cat => cat.trim()).filter(Boolean).map((cat, idx) => {
                        const colorClass = getCategoryColorClass(cat);
                        return (
                          <span key={idx} className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${colorClass}`}>
                            {cat}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status Clínico</span>
                    <strong className="text-slate-900">{selectedPatient.status}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Hipótese Diagnóstica Ativa</span>
                    <strong className="text-slate-950 font-medium">{selectedPatient.diagnosis}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3.5 pt-3 border-t border-slate-50">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Aluno Admissor (Clínica-Escola)</span>
                    <strong className="text-rose-950 font-semibold">{selectedPatient.studentName || 'Não Informado'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estágio / Setor de Atendimento</span>
                    <strong className="text-rose-950 font-semibold">{selectedPatient.internshipStage || 'Não Informado'}</strong>
                  </div>
                </div>
              </div>

              {/* Anamnese */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-widest border-b border-slate-100 pb-1">II. Histórico Clínico de Triagem</h3>
                <div className="text-xs space-y-2 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <p><strong>Observações Gerais:</strong> {selectedPatient.observations || 'Nenhuma.'}</p>
                </div>
              </div>



              {/* Professional stamp space */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-100">
                <div>
                  <div className="h-0.5 bg-slate-300 w-3/4 mx-auto mb-1"></div>
                  <p className="font-semibold text-slate-800">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500">{currentUser.role === 'admin' ? 'Administrador do Núcleo' : currentUser.specialty}</p>
                </div>
                <div>
                  <div className="h-0.5 bg-slate-300 w-3/4 mx-auto mb-1"></div>
                  <p className="font-semibold text-slate-800">Diretoria Clínica do Núcleo</p>
                  <p className="text-[10px] text-slate-500">Carimbo e Assinatura</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
