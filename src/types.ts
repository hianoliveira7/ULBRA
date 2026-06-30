export type UserRole = 'admin' | 'user';

export const CLINICAL_CATEGORIES = ['Saúde Coletiva', 'Hidroterapia', 'Ortopedia', 'Neuro Pediatria', 'Neuro Adulto'];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialty: string;
  active: boolean;
}

export type PatientStatus = 'Ativo' | 'Alta' | 'Em Atendimento';

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate: string;
  address: string;
  category: string; // e.g., 'Psicologia', 'Fisioterapia', 'Nutrição', 'Fonoaudiologia'
  diagnosis: string;
  status: PatientStatus;
  admissionDate: string;
  reasonForConsultation?: string;
  clinicalHistory?: string;
  observations: string;
  studentId?: string; // Mapped to student ID
  studentName?: string;
  internshipStage?: string;
}

export interface Student {
  id: string;
  name: string;
  internshipStage: string; // e.g., 'Fisioterapia Neurofuncional II (8º Período)'
}

export interface Evolution {
  id: string;
  patientId: string;
  date: string;
  authorName: string;
  authorSpecialty: string;
  description: string;
}

export type RequestStatus = 'Pendente' | 'Marcado' | 'Não Marcado';

export interface SchedulingRequest {
  id: string;
  patientId: string;
  patientName: string;
  requesterName: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  status: RequestStatus;
  actionDate?: string;
  feedback?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string or formatted date
  userName: string;
  userRole: UserRole;
  actionType: string; // e.g., 'Admissão', 'Edição', 'Evolução', 'Agendamento', 'Usuário'
  description: string;
}
