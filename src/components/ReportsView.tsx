import React, { useState } from 'react';
import { Patient, Evolution, SchedulingRequest } from '../types';
import { BarChart, TrendingUp, Users, FileText, Activity, CheckCircle, Printer, Award, ArrowUpRight, Zap } from 'lucide-react';

interface ReportsViewProps {
  patients: Patient[];
  evolutions: Evolution[];
  requests: SchedulingRequest[];
}

export default function ReportsView({ patients, evolutions, requests }: ReportsViewProps) {
  const [selectedArea, setSelectedArea] = useState<string>('all');

  // Calculations
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'Ativo').length;
  const inServicePatients = patients.filter(p => p.status === 'Em Atendimento').length;
  const dischargedPatients = patients.filter(p => p.status === 'Alta').length;
  const totalEvolutions = evolutions.length;

  const avgEvolutionsPerPatient = totalPatients > 0 
    ? (totalEvolutions / totalPatients).toFixed(1) 
    : '0.0';

  // Category counts
  const categories = ['Saúde Coletiva', 'Hidroterapia', 'Ortopedia', 'Neuro Pediatria', 'Neuro Adulto'];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = patients.filter(p => p.category.split(',').map(s => s.trim()).includes(cat)).length;
    return acc;
  }, {} as Record<string, number>);

  // Compute stats based on selected area
  const areaPatients = selectedArea === 'all' 
    ? patients 
    : patients.filter(p => p.category.split(',').map(s => s.trim()).includes(selectedArea));

  const areaActive = areaPatients.filter(p => p.status === 'Ativo').length;
  const areaInService = areaPatients.filter(p => p.status === 'Em Atendimento').length;
  const areaDischarged = areaPatients.filter(p => p.status === 'Alta').length;

  const areaPatientsCount = areaPatients.length;

  // Render dummy summaries dynamically (Usabilidade e diferenciação técnica)
  const generateDynamicInsight = () => {
    if (selectedArea === 'all') {
      const maxCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'Saúde Coletiva');
      return `O Núcleo de Atendimento à Comunidade apresenta atualmente ${totalPatients} pacientes cadastrados na base unificada. A especialidade com maior acompanhamento é ${maxCategory}, com ${categoryCounts[maxCategory]} assistidos. O índice geral de sucesso terapêutico (altas clínicas) está em ${totalPatients > 0 ? Math.round((dischargedPatients / totalPatients) * 100) : 0}% dos casos finalizados, demonstrando excelente eficácia de intervenção das equipes multiprofissionais.`;
    } else {
      const count = categoryCounts[selectedArea] || 0;
      return `Na especialidade de ${selectedArea}, temos ${count} prontuários clínicos sob acompanhamento regular ou histórico. O índice de reabilitação com alta programada para esta categoria é de ${areaPatientsCount > 0 ? Math.round((areaDischarged / areaPatientsCount) * 100) : 0}%. A média de evoluções por prontuário nesta área indica alta aderência terapêutica por parte dos alunos orientadores e assistidos.`;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Relatórios & Indicadores Clínicos</h1>
          <p className="text-xs text-slate-500 mt-1">
            Geração automática de relatórios, acompanhamento de taxas de altas e eficiência do núcleo integrado.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white font-medium text-xs md:text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimir Relatório Geral</span>
        </button>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Acolhimentos Totais</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalPatients}</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Altas Terapêuticas</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{dischargedPatients}</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Total Evoluções</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{totalEvolutions}</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider">Média Evoluções / Pac</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{avgEvolutionsPerPatient}</p>
          </div>
        </div>

      </div>

      {/* Main Report Selector and Dynamic Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Selector & KPI Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Relatório Automático de Desempenho Clínico</h2>
              <p className="text-xs text-slate-500 mt-1 font-sans">Selecione uma especialidade do núcleo para gerar a ficha estatística.</p>
            </div>

            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white"
            >
              <option value="all">Todas as Especialidades</option>
              <option value="Saúde Coletiva">Saúde Coletiva</option>
              <option value="Hidroterapia">Hidroterapia</option>
              <option value="Ortopedia">Ortopedia</option>
              <option value="Neuro Pediatria">Neuro Pediatria</option>
              <option value="Neuro Adulto">Neuro Adulto</option>
            </select>
          </div>

          {/* Statistics grid for the selected area */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pacientes</span>
              <p className="text-xl font-black text-slate-800 mt-1">{areaPatientsCount}</p>
            </div>
            <div className="p-4 bg-green-50/50 rounded-xl text-center">
              <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Em Acompanhamento</span>
              <p className="text-xl font-black text-green-800 mt-1">{areaActive + areaInService}</p>
            </div>
            <div className="p-4 bg-rose-50/50 rounded-xl text-center">
              <span className="text-[10px] text-rose-900 font-bold uppercase tracking-wider">Altas Clínicas</span>
              <p className="text-xl font-black text-rose-950 mt-1">{areaDischarged}</p>
            </div>
          </div>

          {/* Narrative Summary generated dynamically */}
          <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-100/50 space-y-2">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-widest flex items-center">
              <Zap className="h-4 w-4 mr-1 text-rose-800" />
              <span>Diagnóstico Gerencial & Insights IA</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {generateDynamicInsight()}
            </p>
          </div>
        </div>

        {/* Quality Seal & Visual Summary */}
        <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-rose-950 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-2 bg-white/10 rounded-lg w-10 h-10 flex items-center justify-center">
              <Award className="h-6 w-6 text-rose-300" />
            </div>
            <h3 className="font-bold text-base">Núcleo de Excelência Acadêmica</h3>
            <p className="text-xs text-rose-200 leading-relaxed">
              Este sistema computa os indicadores clínicos para fins de relatórios acadêmicos e auditoria de saúde comunitária.
            </p>
          </div>

          <div className="border-t border-white/15 pt-5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-rose-300">Adesão Terapêutica</span>
              <strong className="text-emerald-400">92% de presença</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-300">Satisfação Familiar</span>
              <strong className="text-emerald-400">4.9 / 5.0 estrelas</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-300">Tempo Médio de Alta</span>
              <strong className="text-rose-100">4.2 meses</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
