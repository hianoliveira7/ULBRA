import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, Trash2, ShieldAlert, CheckCircle, XCircle, Stethoscope, Mail, ShieldCheck, UserPlus, Eye, EyeOff } from 'lucide-react';

interface UsersViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'active'> & { password?: string }) => void;
  onDeleteUser: (id: string) => void;
}

export default function UsersView({ users, currentUser, onAddUser, onDeleteUser }: UsersViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [specialty, setSpecialty] = useState('Psicologia');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('E-mail já cadastrado no sistema.');
      return;
    }

    onAddUser({
      name,
      email: email.trim(),
      role,
      specialty,
      password: password || (role === 'admin' ? 'admin' : 'user'), // Fallback default passwords for easier testing
    });

    // Reset Form
    setName('');
    setEmail('');
    setRole('user');
    setSpecialty('Psicologia');
    setPassword('');
    setShowAddForm(false);
  };

  const handleDelete = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('Você não pode excluir sua própria conta de administrador ativa.');
      return;
    }

    if (window.confirm(`Deseja revogar o acesso e excluir a conta de "${userName}" permanentemente?`)) {
      onDeleteUser(userId);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Controle de Usuários</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gerenciamento de credenciais de acesso para profissionais de saúde e administradores credenciados do Núcleo.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white font-medium text-xs md:text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      {/* ======================= ADD USER FORM ======================= */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-100 bg-rose-50/25">
            <h2 className="text-sm font-bold text-rose-950 flex items-center space-x-2">
              <UserPlus className="h-4.5 w-4.5 text-rose-800" />
              <span>Cadastrar Novo Usuário</span>
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded border border-rose-100">{error}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo do Profissional *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dr. João Alencar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  placeholder="ex: joao@nucleo.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perfil de Acesso *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800 font-semibold"
                >
                  <option value="user">Usuário (Profissional)</option>
                  <option value="admin">Administrador (ADM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidade Clínica *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Psicologia Clínica, Fisioterapia, etc."
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Entrada</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Se vazio, padrão 'user' ou 'admin'"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3.5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
            >
              Criar Usuário
            </button>
          </div>
        </form>
      )}

      {/* ======================= USERS LIST GRID ======================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const isAdmin = user.role === 'admin';
          const isSelf = user.id === currentUser.id;

          return (
            <div 
              key={user.id} 
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header Profile Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${
                    isAdmin 
                      ? 'bg-rose-950 text-rose-100 border-rose-900' 
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {isAdmin ? 'Administrador' : 'Profissional'}
                  </span>

                  <span className="flex items-center space-x-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] text-slate-400 font-bold">Ativo</span>
                  </span>
                </div>

                {/* Primary info */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                    <span>{user.name}</span>
                    {isSelf && <span className="text-[10px] font-bold text-rose-800 font-mono bg-rose-50 px-1.5 rounded">(você)</span>}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center">
                    <Stethoscope className="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" />
                    <span>{user.specialty}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-mono break-all flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" />
                    <span>{user.email}</span>
                  </p>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-5 pt-3.5 border-t border-slate-50 flex justify-end">
                {isSelf ? (
                  <span className="text-[10px] text-slate-400 font-semibold italic">Administrador Ativo</span>
                ) : (
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Revogar Acesso</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
