import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { Search, ShieldAlert, Calendar, User, Tag, Clock } from 'lucide-react';

interface LogsViewProps {
  logs: ActivityLog[];
}

export default function LogsView({ logs }: LogsViewProps) {
  const [searchText, setSearchText] = useState('');

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchText.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchText.toLowerCase()) ||
    log.actionType.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Registro de Atividades (Logs)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Trilha de auditoria em conformidade com as boas práticas de segurança de dados de saúde. Todas as ações cruciais são documentadas.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por usuário, tipo de ação ou descrição..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Histórico Descritivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length > 0 ? (
                [...filteredLogs].reverse().map((log) => {
                  const roleBadge = log.userRole === 'admin' 
                    ? 'bg-rose-900 text-rose-100' 
                    : 'bg-slate-200 text-slate-700';

                  const typeColor = 
                    log.actionType === 'Admissão' ? 'text-emerald-700 font-bold' :
                    log.actionType === 'Evolução' ? 'text-blue-700 font-bold' :
                    log.actionType === 'Agendamento' ? 'text-amber-700 font-bold' :
                    log.actionType === 'Exclusão' ? 'text-rose-700 font-bold' :
                    'text-slate-700 font-medium';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap flex items-center space-x-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {log.userName}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${roleBadge}`}>
                          {log.userRole === 'admin' ? 'Administrador' : 'Profissional'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-mono tracking-wider uppercase ${typeColor}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed min-w-[250px]">
                        {log.description}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <ShieldAlert className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="font-medium text-slate-500">Nenhum log correspondente aos filtros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
