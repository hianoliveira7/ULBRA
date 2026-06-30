import { User, Patient, Student, Evolution, SchedulingRequest, ActivityLog } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  INITIAL_USERS, INITIAL_PATIENTS, INITIAL_STUDENTS, INITIAL_EVOLUTIONS, 
  INITIAL_SCHEDULING_REQUESTS, INITIAL_LOGS 
} from './data';

// --- MAPPINGS ---

function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    specialty: row.specialty || '',
    active: row.active ?? true,
  };
}

function mapUserToDb(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    specialty: u.specialty,
    active: u.active,
  };
}

function mapPatientFromDb(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf || '',
    phone: row.phone || '',
    email: row.email || '',
    birthDate: row.birth_date || '',
    address: row.address || '',
    category: row.category,
    diagnosis: row.diagnosis || '',
    status: row.status,
    admissionDate: row.admission_date || '',
    reasonForConsultation: row.reason_for_consultation || '',
    clinicalHistory: row.clinical_history || '',
    observations: row.observations || '',
    studentId: row.student_id || '',
    studentName: row.student_name || '',
    internshipStage: row.internship_stage || '',
  };
}

function mapPatientToDb(p: Patient) {
  return {
    id: p.id,
    name: p.name,
    cpf: p.cpf,
    phone: p.phone,
    email: p.email,
    birth_date: p.birthDate,
    address: p.address,
    category: p.category,
    diagnosis: p.diagnosis,
    status: p.status,
    admission_date: p.admissionDate,
    reason_for_consultation: p.reasonForConsultation,
    clinical_history: p.clinicalHistory,
    observations: p.observations,
    student_id: p.studentId || null,
    student_name: p.studentName || null,
    internship_stage: p.internshipStage || null,
  };
}

function mapEvolutionFromDb(row: any): Evolution {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    authorName: row.author_name,
    authorSpecialty: row.author_specialty || '',
    description: row.description,
  };
}

function mapEvolutionToDb(e: Evolution) {
  return {
    id: e.id,
    patient_id: e.patientId,
    date: e.date,
    author_name: e.authorName,
    author_specialty: e.authorSpecialty,
    description: e.description,
  };
}

function mapRequestFromDb(row: any): SchedulingRequest {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    requesterName: row.requester_name,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    reason: row.reason || '',
    status: row.status,
    actionDate: row.action_date || undefined,
    feedback: row.feedback || undefined,
  };
}

function mapRequestToDb(r: SchedulingRequest) {
  return {
    id: r.id,
    patient_id: r.patientId,
    patient_name: r.patientName,
    requester_name: r.requesterName,
    requested_date: r.requestedDate,
    requested_time: r.requestedTime,
    reason: r.reason,
    status: r.status,
    action_date: r.actionDate || null,
    feedback: r.feedback || null,
  };
}

function mapLogFromDb(row: any): ActivityLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    userName: row.user_name,
    userRole: row.user_role,
    actionType: row.action_type,
    description: row.description,
  };
}

function mapLogToDb(l: ActivityLog) {
  return {
    id: l.id,
    timestamp: l.timestamp,
    user_name: l.userName,
    user_role: l.userRole,
    action_type: l.actionType,
    description: l.description,
  };
}

function mapStudentFromDb(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    internshipStage: row.internship_stage || '',
    semester: row.semester || '',
  };
}

function mapStudentToDb(s: Student) {
  return {
    id: s.id,
    name: s.name,
    internship_stage: s.internshipStage,
    semester: s.semester,
  };
}

// State to track if there was a schema error (missing tables)
export interface SyncStatus {
  connected: boolean;
  tablesMissing: boolean;
  errorMessage?: string;
}

export let syncStatus: SyncStatus = {
  connected: isSupabaseConfigured,
  tablesMissing: false,
};

// --- API METHODS ---

export async function fetchUsers(): Promise<{ data: User[]; tablesMissing: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: getLocalUsers(), tablesMissing: false };
  }

  try {
    const { data, error } = await supabase.from('nac_users').select('*');
    if (error) {
      if (error.code === '42P01') { // PostgreSQL table does not exist
        return { data: getLocalUsers(), tablesMissing: true };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      // Seed initial users into Supabase
      const seedData = INITIAL_USERS.map(mapUserToDb);
      const { error: seedError } = await supabase.from('nac_users').insert(seedData);
      if (!seedError) {
        return { data: INITIAL_USERS, tablesMissing: false };
      }
    }

    return { data: data.map(mapUserFromDb), tablesMissing: false };
  } catch (err: any) {
    console.error('Error fetching users from Supabase:', err);
    return { data: getLocalUsers(), tablesMissing: err.code === '42P01' };
  }
}

export async function saveUser(user: User): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbRow = mapUserToDb(user);
    const { error } = await supabase.from('nac_users').upsert(dbRow);
    if (error) throw error;
  } catch (err) {
    console.error('Error saving user to Supabase:', err);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('nac_users').delete().eq('id', userId);
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting user from Supabase:', err);
  }
}

export async function fetchPatients(): Promise<{ data: Patient[]; tablesMissing: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: getLocalPatients(), tablesMissing: false };
  }

  try {
    const { data, error } = await supabase.from('nac_patients').select('*');
    if (error) {
      if (error.code === '42P01') {
        return { data: getLocalPatients(), tablesMissing: true };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      // Seed initial patients
      const seedData = INITIAL_PATIENTS.map(mapPatientToDb);
      const { error: seedError } = await supabase.from('nac_patients').insert(seedData);
      if (!seedError) {
        return { data: INITIAL_PATIENTS, tablesMissing: false };
      }
    }

    return { data: data.map(mapPatientFromDb), tablesMissing: false };
  } catch (err: any) {
    console.error('Error fetching patients from Supabase:', err);
    return { data: getLocalPatients(), tablesMissing: err.code === '42P01' };
  }
}

export async function savePatient(patient: Patient): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbRow = mapPatientToDb(patient);
    const { error } = await supabase.from('nac_patients').upsert(dbRow);
    if (error) throw error;
  } catch (err) {
    console.error('Error saving patient to Supabase:', err);
  }
}

export async function deletePatient(patientId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('nac_patients').delete().eq('id', patientId);
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting patient from Supabase:', err);
  }
}

export async function fetchEvolutions(): Promise<{ data: Evolution[]; tablesMissing: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: getLocalEvolutions(), tablesMissing: false };
  }

  try {
    const { data, error } = await supabase.from('nac_evolutions').select('*');
    if (error) {
      if (error.code === '42P01') {
        return { data: getLocalEvolutions(), tablesMissing: true };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      // Seed initial evolutions
      const seedData = INITIAL_EVOLUTIONS.map(mapEvolutionToDb);
      const { error: seedError } = await supabase.from('nac_evolutions').insert(seedData);
      if (!seedError) {
        return { data: INITIAL_EVOLUTIONS, tablesMissing: false };
      }
    }

    return { data: data.map(mapEvolutionFromDb), tablesMissing: false };
  } catch (err: any) {
    console.error('Error fetching evolutions from Supabase:', err);
    return { data: getLocalEvolutions(), tablesMissing: err.code === '42P01' };
  }
}

export async function saveEvolution(evolution: Evolution): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbRow = mapEvolutionToDb(evolution);
    const { error } = await supabase.from('nac_evolutions').upsert(dbRow);
    if (error) throw error;
  } catch (err) {
    console.error('Error saving evolution to Supabase:', err);
  }
}

export async function fetchRequests(): Promise<{ data: SchedulingRequest[]; tablesMissing: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: getLocalRequests(), tablesMissing: false };
  }

  try {
    const { data, error } = await supabase.from('nac_requests').select('*');
    if (error) {
      if (error.code === '42P01') {
        return { data: getLocalRequests(), tablesMissing: true };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      // Seed initial requests
      const seedData = INITIAL_SCHEDULING_REQUESTS.map(mapRequestToDb);
      const { error: seedError } = await supabase.from('nac_requests').insert(seedData);
      if (!seedError) {
        return { data: INITIAL_SCHEDULING_REQUESTS, tablesMissing: false };
      }
    }

    return { data: data.map(mapRequestFromDb), tablesMissing: false };
  } catch (err: any) {
    console.error('Error fetching requests from Supabase:', err);
    return { data: getLocalRequests(), tablesMissing: err.code === '42P01' };
  }
}

export async function saveRequest(request: SchedulingRequest): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbRow = mapRequestToDb(request);
    const { error } = await supabase.from('nac_requests').upsert(dbRow);
    if (error) throw error;
  } catch (err) {
    console.error('Error saving request to Supabase:', err);
  }
}

export async function fetchLogs(): Promise<{ data: ActivityLog[]; tablesMissing: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: getLocalLogs(), tablesMissing: false };
  }

  try {
    const { data, error } = await supabase.from('nac_logs').select('*');
    if (error) {
      if (error.code === '42P01') {
        return { data: getLocalLogs(), tablesMissing: true };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      // Seed initial logs
      const seedData = INITIAL_LOGS.map(mapLogToDb);
      const { error: seedError } = await supabase.from('nac_logs').insert(seedData);
      if (!seedError) {
        return { data: INITIAL_LOGS, tablesMissing: false };
      }
    }

    // Sort by timestamp desc to match user experience
    const parsedLogs = data.map(mapLogFromDb);
    parsedLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return { data: parsedLogs, tablesMissing: false };
  } catch (err: any) {
    console.error('Error fetching logs from Supabase:', err);
    return { data: getLocalLogs(), tablesMissing: err.code === '42P01' };
  }
}

export async function saveLog(log: ActivityLog): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbRow = mapLogToDb(log);
    const { error } = await supabase.from('nac_logs').upsert(dbRow);
    if (error) throw error;
  } catch (err) {
    console.error('Error saving log to Supabase:', err);
  }
}

export async function fetchStudents(): Promise<{ data: Student[]; tablesMissing: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: getLocalStudents(), tablesMissing: false };
  }

  try {
    const { data, error } = await supabase.from('nac_students').select('*');
    if (error) {
      if (error.code === '42P01') {
        return { data: getLocalStudents(), tablesMissing: true };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      // Seed initial students
      const seedData = INITIAL_STUDENTS.map(mapStudentToDb);
      const { error: seedError } = await supabase.from('nac_students').insert(seedData);
      if (!seedError) {
        return { data: INITIAL_STUDENTS, tablesMissing: false };
      }
    }

    return { data: data.map(mapStudentFromDb), tablesMissing: false };
  } catch (err: any) {
    console.error('Error fetching students from Supabase:', err);
    return { data: getLocalStudents(), tablesMissing: err.code === '42P01' };
  }
}

export async function saveStudent(student: Student): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbRow = mapStudentToDb(student);
    const { error } = await supabase.from('nac_students').upsert(dbRow);
    if (error) throw error;
  } catch (err) {
    console.error('Error saving student to Supabase:', err);
  }
}

export async function deleteStudent(studentId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { error } = await supabase.from('nac_students').delete().eq('id', studentId);
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting student from Supabase:', err);
  }
}

// --- LOCAL FALLBACK READS ---

function getLocalStudents(): Student[] {
  const saved = localStorage.getItem('nac_students');
  return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
}

function getLocalUsers(): User[] {
  const saved = localStorage.getItem('nac_users');
  return saved ? JSON.parse(saved) : INITIAL_USERS;
}

function getLocalPatients(): Patient[] {
  const saved = localStorage.getItem('nac_patients');
  return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
}

function getLocalEvolutions(): Evolution[] {
  const saved = localStorage.getItem('nac_evolutions');
  return saved ? JSON.parse(saved) : INITIAL_EVOLUTIONS;
}

function getLocalRequests(): SchedulingRequest[] {
  const saved = localStorage.getItem('nac_requests');
  return saved ? JSON.parse(saved) : INITIAL_SCHEDULING_REQUESTS;
}

function getLocalLogs(): ActivityLog[] {
  const saved = localStorage.getItem('nac_logs');
  return saved ? JSON.parse(saved) : INITIAL_LOGS;
}
