import React, { useState } from 'react';
import { SchedulingRequest, Patient, User } from '../types';
import { 
  Calendar, Clock, CheckCircle2, XCircle, Clock4, Plus, UserCheck, 
  UserX, FileText, ChevronRight, CornerDownRight, MessageSquare 
} from 'lucide-react';

interface SchedulingViewProps {
  requests: SchedulingRequest[];
  patients: Patient[];
  currentUser: User;
  onAddRequest: (request: Omit<SchedulingRequest, 'id' | 'status' | 'requesterName'>) => void;
  onUpdateRequestStatus: (id: string, status: 'Marcado' | 'Não Marcado', feedback?: string) => void;
}

export default function SchedulingView({
  requests,
  patients,
  currentUser,
  onAddRequest,
  onUpdateRequestStatus,
}: SchedulingViewProps) {
  const [viewState, setViewState] = useState<'list' | 'create'>('list');
  
  // New Request Form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Admin response state
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<'Marcado' | 'Não Marcado'>('Marcado');
  const [adminFeedback, setAdminFeedback] = useState('');

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPatientId) {
      setError('Por favor, selecione um paciente para solicitar agendamento.');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    onAddRequest({
      patientId: patient.id,
      patientName: patient.name,
      requestedDate,
      requestedTime,
      reason,
    });

    // Reset Form
    setSelectedPatientId('');
    setRequestedDate('');
    setRequestedTime('');
    setReason('');
    setViewState('list');
  };

  const handleAdminRespondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (respondingRequestId) {
      onUpdateRequestStatus(respondingRequestId, responseStatus, adminFeedback);
      setRespondingRequestId(null);
      setAdminFeedback('');
    }
  };

  // Filter requests based on user
  const visibleRequests = currentUser.role === 'admin' 
    ? requests 
    : requests.filter(r => r.requesterName === currentUser.name);

  const pendingCount = visibleRequests.filter(r => r.status === 'Pendente').length;
  const approvedCount = visibleRequests.filter(r => r.status === 'Marcado').length;
  const refusedCount = visibleRequests.filter(r => r.status === 'Não Marcado').length;

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Solicitações de Agendamento</h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser.role === 'admin'
              ? 'Análise e homologação de agendamentos solicitados pelos profissionais de saúde.'
              : 'Solicite novas agendas e acompanhe em tempo real o parecer da diretoria.'}
          </p>
        </div>

        {viewState === 'list' && currentUser.role === 'user' && (
          <button
            onClick={() => setViewState('create')}
            className="w-full sm:w-auto px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white font-medium text-xs md:text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Solicitar Agendamento</span>
          </button>
        )}

        {viewState !== 'list' && (
          <button
            onClick={() => setViewState('list')}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs md:text-sm rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            Voltar para Lista
          </button>
        )}
      </div>

      {/* KPI mini row */}
      {viewState === 'list' && (
        <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-xl">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pendentes</span>
            <p className="text-lg font-extrabold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Marcados</span>
            <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{approvedCount}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Não Marcados</span>
            <p className="text-lg font-extrabold text-rose-700 mt-0.5">{refusedCount}</p>
          </div>
        </div>
      )}

      {/* ======================= LIST VIEW ======================= */}
      {viewState === 'list' && (
        <div className="space-y-4">
          
          {visibleRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...visibleRequests].reverse().map((req) => {
                const statusConfig = 
                  req.status === 'Pendente' ? { icon: Clock4, color: 'bg-amber-50 text-amber-700 border-amber-200' } :
                  req.status === 'Marcado' ? { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' } :
                  { icon: XCircle, color: 'bg-rose-50 text-rose-700 border-rose-200' };

                const StatusIcon = statusConfig.icon;

                return (
                  <div 
                    key={req.id} 
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Status / Requester Row */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-1">
                          <StatusIcon className="h-4 w-4 text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-medium">Solicitado por: <strong>{req.requesterName}</strong></span>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${statusConfig.color} uppercase tracking-wider`}>
                          {req.status}
                        </span>
                      </div>

                      {/* Patient Name / Info */}
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1">
                        {req.patientName}
                      </h3>

                      <div className="grid grid-cols-2 gap-3 mt-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Data Solicitada</p>
                          <p className="font-bold text-slate-700 flex items-center mt-0.5">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                            {req.requestedDate}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Horário</p>
                          <p className="font-bold text-slate-700 flex items-center mt-0.5">
                            <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" />
                            {req.requestedTime}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Justificativa Clínica</p>
                          <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded border border-slate-100 mt-1">
                            "{req.reason}"
                          </p>
                        </div>

                        {/* Admin Feedback */}
                        {req.feedback && (
                          <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-100/50 text-xs text-rose-950">
                            <p className="font-bold text-[10px] uppercase text-rose-900 flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              <span>Parecer da Diretoria ({req.actionDate})</span>
                            </p>
                            <p className="mt-1 italic">"{req.feedback}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions directly on card */}
                    {currentUser.role === 'admin' && req.status === 'Pendente' && (
                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-end space-x-2">
                        {respondingRequestId === req.id ? (
                          <form onSubmit={handleAdminRespondSubmit} className="w-full space-y-3 pt-2">
                            <div className="flex space-x-3 text-xs font-semibold">
                              <label className="flex items-center space-x-1 text-emerald-800">
                                <input 
                                  type="radio" 
                                  name="status" 
                                  checked={responseStatus === 'Marcado'} 
                                  onChange={() => setResponseStatus('Marcado')}
                                />
                                <span>Marcar</span>
                              </label>
                              <label className="flex items-center space-x-1 text-rose-800">
                                <input 
                                  type="radio" 
                                  name="status" 
                                  checked={responseStatus === 'Não Marcado'} 
                                  onChange={() => setResponseStatus('Não Marcado')}
                                />
                                <span>Não Marcar</span>
                              </label>
                            </div>
                            
                            <input
                              type="text"
                              required
                              placeholder="Feedback / Observações para o profissional..."
                              value={adminFeedback}
                              onChange={(e) => setAdminFeedback(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-slate-800"
                            />

                            <div className="flex justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setRespondingRequestId(null)}
                                className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded text-slate-500 cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1 text-[10px] font-bold bg-rose-800 hover:bg-rose-900 text-white rounded cursor-pointer"
                              >
                                Enviar Parecer
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => {
                              setRespondingRequestId(req.id);
                              setResponseStatus('Marcado');
                            }}
                            className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span>Responder Solicitação</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <Calendar className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">Nenhum agendamento registrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Ainda não existem solicitações registradas {currentUser.role === 'user' && 'por você'} para pacientes do núcleo.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ======================= CREATE REQUEST FORM ======================= */}
      {viewState === 'create' && currentUser.role === 'user' && (
        <form onSubmit={handleRequestSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 bg-rose-50/20">
            <h2 className="text-base font-bold text-rose-950 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-rose-800" />
              <span>Solicitar Agendamento Clínico</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Sua solicitação passará pela análise de disponibilidade do Diretor/Administrador do Núcleo.</p>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded border border-rose-100">{error}</p>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selecione o Paciente *</label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800 font-semibold"
              >
                <option value="">-- Escolha o Paciente do Núcleo --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Data Desejada *</label>
                <input
                  type="date"
                  required
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Recomendado *</label>
                <input
                  type="time"
                  required
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Justificativa Clínica para o Agendamento *</label>
              <textarea
                required
                rows={3}
                placeholder="Exemplo: Retorno para entrega de plano dietético ou consulta extra de reabilitação fisioterápica por dores persistentes..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-slate-800"
              ></textarea>
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
              Enviar Solicitação de Agenda
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
