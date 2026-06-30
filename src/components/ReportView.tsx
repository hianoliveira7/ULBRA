import React from 'react';
import { Patient, Student, User, CLINICAL_CATEGORIES } from '../types';
import { LayoutDashboard } from 'lucide-react';

interface ReportViewProps {
  patients: Patient[];
  students: Student[];
  currentUser: User;
}

export default function ReportView({ patients, students, currentUser }: ReportViewProps) {
  // Group students by clinical category (from their internshipStage)
  const groupedData = CLINICAL_CATEGORIES.filter(category => {
    return currentUser.role === 'admin' || category === currentUser.specialty;
  }).map(category => {
    const studentsInCategory = students.filter(s => s.internshipStage.includes(category));
    
    const studentsWithPatients = studentsInCategory.map(student => {
      const assignedPatients = patients.filter(p => (p.studentId === student.id || p.studentName === student.name) && (currentUser.role === 'admin' || p.category.includes(currentUser.specialty)));
      return { student, patients: assignedPatients };
    });

    return { category, data: studentsWithPatients };
  }).filter(g => g.data.some(s => s.patients.length > 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <LayoutDashboard className="h-8 w-8 text-rose-800" />
        <h1 className="text-2xl font-extrabold text-slate-800">Relatório de Atendimentos</h1>
      </div>

      {groupedData.map(group => (
        <div key={group.category} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-rose-950 uppercase tracking-wide border-b border-rose-100 pb-2">
            {group.category}
          </h2>

          {group.data.filter(s => s.patients.length > 0).map(s => (
            <div key={s.student.id} className="space-y-2 border-l-2 border-slate-200 pl-4">
              <h3 className="font-bold text-slate-800">{s.student.name} ({s.student.internshipStage})</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {s.patients.map(p => (
                  <div key={p.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">Horário: {p.attendanceTime || 'Não definido'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
