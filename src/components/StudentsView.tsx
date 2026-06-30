import React, { useState } from 'react';
import { Student, Patient, CLINICAL_CATEGORIES } from '../types';
import { 
  Plus, Trash2, Search, 
  UserCheck, Clipboard, Calendar,
  X, Save, Edit2, GraduationCap, AlertCircle
} from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  patients: Patient[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export default function StudentsView({ 
  students, 
  patients, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent 
}: StudentsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [internshipStage, setInternshipStage] = useState(CLINICAL_CATEGORIES[0]);
  const [error, setError] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('O nome do aluno é obrigatório.');
      return;
    }
    if (!internshipStage.trim()) {
      setError('O estágio / período é obrigatório.');
      return;
    }

    onAddStudent({
      name: name.trim(),
      internshipStage: internshipStage.trim(),
    });

    // Reset fields
    setName('');
    setInternshipStage(CLINICAL_CATEGORIES[0]);
    setShowAddForm(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editingStudent.name.trim()) {
      alert('O nome do aluno é obrigatório.');
      return;
    }
    if (!editingStudent.internshipStage.trim()) {
      alert('O estágio / período é obrigatório.');
      return;
    }

    onUpdateStudent(editingStudent);
    if (selectedStudent?.id === editingStudent.id) {
      setSelectedStudent(editingStudent);
    }
    setEditingStudent(null);
  };

  const handleDelete = (student: Student) => {
    const assignedPatients = patients.filter(p => p.studentId === student.id || p.studentName === student.name);
    
    let confirmMsg = `Deseja realmente descredenciar/excluir o aluno "${student.name}"?`;
    if (assignedPatients.length > 0) {
      confirmMsg = `ATENÇÃO: O aluno "${student.name}" possui ${assignedPatients.length} paciente(s) sob sua responsabilidade clínica. Deseja realmente excluí-lo? (Os prontuários continuarão ativos, mas sem aluno responsável associado)`;
    }

    if (window.confirm(confirmMsg)) {
      onDeleteStudent(student.id);
      if (selectedStudent?.id === student.id) {
        setSelectedStudent(null);
      }
    }
  };

  const startEdit = (student: Student) => {
    setEditingStudent({ ...student });
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.internshipStage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center space-x-2">
            <GraduationCap className="h-7 w-7 text-rose-800" />
            <span>Admissão & Cadastro de Alunos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle de alunos de estágio curricular obrigatório e voluntário alocados na Clínica-Escola.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setSelectedStudent(null);
              setEditingStudent(null);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white font-medium text-xs md:text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Admitir Aluno</span>
          </button>
        )}
      </div>

      {/* ======================= ADMISSION FORM (CREATE) ======================= */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-100 bg-rose-50/20 flex justify-between items-center">
            <h2 className="text-sm font-bold text-rose-950 flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-rose-800" />
              <span>Formulário de Admissão de Aluno de Estágio</span>
            </h2>
            <button 
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo do Aluno *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do aluno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidade / Setor de Alocação *</label>
                <select
                  required
                  value={internshipStage}
                  onChange={(e) => setInternshipStage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800 font-semibold"
                >
                  {CLINICAL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Admitir e Cadastrar Aluno</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================= DOUBLE COLUMN VIEW ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left list panel */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar aluno por nome ou estágio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />
          </div>

          {/* Students List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => {
                const assignedCount = patients.filter(p => p.studentId === student.id || p.studentName === student.name).length;
                const isSelected = selectedStudent?.id === student.id;

                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setEditingStudent(null);
                      setShowAddForm(false);
                    }}
                    className={`p-4 transition-all hover:bg-rose-50/10 cursor-pointer flex items-start justify-between ${
                      isSelected ? 'bg-rose-50/30 border-l-4 border-rose-800' : ''
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <h4 className="font-bold text-xs md:text-sm text-slate-800 flex items-center gap-1">
                        <span>{student.name}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold line-clamp-1">{student.internshipStage}</p>
                      
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Clipboard className="h-3 w-3" />
                          <span>{assignedCount} paciente{assignedCount !== 1 ? 's' : ''}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <GraduationCap className="h-8 w-8 mx-auto text-slate-300 mb-2 animate-pulse" />
                <p className="text-xs font-semibold">Nenhum aluno cadastrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Details / Edit Panel */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 animate-fadeIn">
              
              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-800 font-extrabold text-lg shrink-0">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center space-x-2">
                      <span>{selectedStudent.name}</span>
                    </h2>
                    <p className="text-xs font-bold text-rose-900 mt-0.5">{selectedStudent.internshipStage}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => startEdit(selectedStudent)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-rose-800 transition-colors cursor-pointer"
                    title="Editar Cadastro"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedStudent)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-rose-800 transition-colors cursor-pointer"
                    title="Remover Registro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Editing Form */}
              {editingStudent ? (
                <form onSubmit={handleEditSubmit} className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest border-b border-slate-200/60 pb-1.5">
                    Modificar Registro de Aluno
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={editingStudent.name}
                        onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase">Especialidade / Setor</label>
                      <select
                        required
                        value={editingStudent.internshipStage}
                        onChange={(e) => setEditingStudent({ ...editingStudent, internshipStage: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 font-semibold"
                      >
                        {CLINICAL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-rose-800 hover:bg-rose-900 text-white rounded text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Save className="h-3 w-3" />
                        <span>Salvar</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                    <h3 className="text-[10px] font-bold text-rose-900 uppercase tracking-wider flex items-center space-x-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>Dados Acadêmicos</span>
                    </h3>
                  </div>
                </div>
              )}

              {/* Assigned Patients Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                  <Clipboard className="h-4.5 w-4.5 text-rose-800" />
                  <span>Prontuários sob Responsabilidade Clínica</span>
                </h3>

                {patients.filter(p => p.studentId === selectedStudent.id || p.studentName === selectedStudent.name).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patients
                      .filter(p => p.studentId === selectedStudent.id || p.studentName === selectedStudent.name)
                      .map(patient => (
                        <div 
                          key={patient.id}
                          className="p-3.5 bg-rose-50/15 rounded-xl border border-rose-100/40 flex justify-between items-center"
                        >
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-xs text-slate-800">{patient.name}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">{patient.category}</p>
                          </div>
                          
                          <span className="text-[10px] bg-white border border-rose-100 text-rose-800 font-bold px-2 py-1 rounded">
                            Prontuário Ativo
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <UserCheck className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Este aluno ainda não possui pacientes vinculados ao seu prontuário de admissão.</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <GraduationCap className="h-14 w-14 text-rose-800/20 mb-3" />
              <h3 className="text-base font-bold text-slate-700">Admissão de Alunos</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Selecione um aluno na barra lateral para examinar seus dados, contatos, estágio ativo e prontuários vinculados à sua admissão.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
