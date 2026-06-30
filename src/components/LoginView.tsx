import React, { useState } from 'react';
import { User } from '../types';
import { Stethoscope, Lock, Mail, ChevronRight, Activity, ShieldAlert, UserPlus, ArrowLeft } from 'lucide-react';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function LoginView({ users, onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check against predefined emails
    const foundUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (foundUser) {
      // In this system, password matches the part before @ for simplicity, or "admin"/"user"
      const expectedPass = foundUser.role === 'admin' ? 'admin' : 'user';
      if (password === expectedPass) {
        onLogin(foundUser);
      } else {
        setError(`Senha incorreta. Use "admin" para ADM ou "user" para Profissional.`);
      }
    } else {
      setError('E-mail não cadastrado neste núcleo.');
    }
  };

  const handleQuickLogin = (user: User) => {
    onLogin(user);
  };

  return (
    <div id="login-screen" className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
        
        {/* Left column: Branding / Visual (Deep Wine gradient) */}
        <div className="md:w-1/2 bg-red-950 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden border-r border-red-900">
          {/* Subtle abstract background art */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-red-800/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-red-500/5 rounded-full blur-xl"></div>

          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-red-800 rotate-45"></div>
            </div>
            <span className="font-bold text-lg tracking-wider text-white">PRONTUÁRIO NAC</span>
          </div>

          <div className="my-12 relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Prontuário do <span className="text-red-300">Núcleo de Atendimento à Comunidade</span>
            </h1>
            <p className="mt-4 text-red-200/70 text-sm leading-relaxed max-w-sm">
              Gestão clínica integrada para clínicas escola e centros de saúde comunitários. Organização, segurança, evolução e agendamentos em um só lugar.
            </p>
          </div>

          <div className="border-t border-red-900/50 pt-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="text-xs text-red-300">
                <p className="font-semibold">Plataforma Acadêmica & Social</p>
                <p className="text-red-400/80">Atendimento humanizado focado em resultados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form & Quick Access */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          
          {isSignup ? (
            <div className="space-y-4">
              <button onClick={() => setIsSignup(false)} className="flex items-center text-xs text-gray-500 hover:text-gray-800 font-semibold mb-4">
                <ArrowLeft className="h-3 w-3 mr-1" /> Voltar ao Login
              </button>
              <h2 className="text-2xl font-bold text-gray-800">Cadastrar Novo Usuário</h2>
              <p className="text-gray-500 text-sm mt-1">Preencha os dados abaixo para solicitar acesso</p>
              
              <div className="space-y-4 pt-4">
                <input type="text" placeholder="Nome Completo" className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800" />
                <input type="email" placeholder="E-mail Corporativo" className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800" />
                <input type="password" placeholder="Definir Senha" className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800" />
                <button className="w-full py-2.5 bg-red-800 text-white font-medium text-sm rounded-lg hover:bg-red-900">
                  Solicitar Cadastro
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Acesse o Sistema</h2>
                <p className="text-gray-500 text-sm mt-1">Insira suas credenciais para entrar no prontuário</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs flex items-center space-x-2 animate-pulse">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">E-mail Corporativo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: admin@nucleo.edu"
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:bg-white transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Senha de Acesso</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha"
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 focus:bg-white transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button type="button" onClick={() => setIsSignup(true)} className="text-xs text-red-800 font-semibold hover:underline">
                    Cadastrar novo usuário
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-800 hover:bg-red-900 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Entrar</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>

              {/* Quick login section (Diferencial de usabilidade) */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Acesso Rápido para Avaliação</span>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {users.slice(0, 2).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleQuickLogin(user)}
                      className="w-full p-3 bg-gray-50 hover:bg-red-50/30 hover:border-red-100 border border-gray-200 rounded-lg text-left transition-all group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-1.5 rounded ${user.role === 'admin' ? 'bg-red-950 text-white' : 'bg-gray-200 text-gray-700'} group-hover:scale-105 transition-transform`}>
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{user.name}</p>
                          <p className="text-[10px] text-gray-500">{user.role === 'admin' ? 'Administrador (Acesso Total)' : `Profissional • ${user.specialty}`}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-red-800 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
