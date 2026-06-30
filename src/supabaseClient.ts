import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Clean up any double quotes or spaces that users might copy-paste
const cleanUrl = supabaseUrl.replace(/^"|"$/g, '').trim();
const cleanKey = supabaseAnonKey.replace(/^"|"$/g, '').trim();

export const isSupabaseConfigured = Boolean(cleanUrl && cleanKey && cleanUrl.startsWith('http'));

export const supabase = isSupabaseConfigured 
  ? createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

export const SQL_SCHEMA = `-- SQL para criar as tabelas no seu projeto Supabase.
-- Abra o SQL Editor no seu painel do Supabase, cole este script e clique em "Run".

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.nac_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    specialty TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABELA DE PACIENTES
CREATE TABLE IF NOT EXISTS public.nac_patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    email TEXT,
    birth_date TEXT, -- Mapped to birthDate
    address TEXT,
    category TEXT NOT NULL,
    diagnosis TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Alta', 'Em Atendimento')),
    admission_date TEXT, -- Mapped to admissionDate
    reason_for_consultation TEXT, -- Mapped to reasonForConsultation
    clinical_history TEXT, -- Mapped to clinicalHistory
    observations TEXT,
    student_id TEXT, -- Mapped to studentId
    student_name TEXT, -- Mapped to studentName
    internship_stage TEXT, -- Mapped to internshipStage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.1 TABELA DE ALUNOS (CLÍNICA-ESCOLA)
CREATE TABLE IF NOT EXISTS public.nac_students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    email TEXT,
    internship_stage TEXT NOT NULL, -- Mapped to internshipStage
    semester TEXT NOT NULL, -- Mapped to semester
    admission_date TEXT NOT NULL, -- Mapped to admissionDate
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABELA DE EVOLUÇÕES CLÍNICAS
CREATE TABLE IF NOT EXISTS public.nac_evolutions (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.nac_patients(id) ON DELETE CASCADE, -- Mapped to patientId
    date TEXT NOT NULL,
    author_name TEXT NOT NULL, -- Mapped to authorName
    author_specialty TEXT, -- Mapped to authorSpecialty
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABELA DE SOLICITAÇÕES DE AGENDAMENTO
CREATE TABLE IF NOT EXISTS public.nac_requests (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL, -- Mapped to patientId
    patient_name TEXT NOT NULL, -- Mapped to patientName
    requester_name TEXT NOT NULL, -- Mapped to requesterName
    requested_date TEXT NOT NULL, -- Mapped to requestedDate
    requested_time TEXT NOT NULL, -- Mapped to requestedTime
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Marcado', 'Não Marcado')),
    action_date TEXT, -- Mapped to actionDate
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELA DE REGISTRO DE ATIVIDADES / LOGS
CREATE TABLE IF NOT EXISTS public.nac_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user_name TEXT NOT NULL, -- Mapped to userName
    user_role TEXT NOT NULL, -- Mapped to userRole
    action_type TEXT NOT NULL, -- Mapped to actionType
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- IMPORTANTE: Para fins de teste/desenvolvimento rápido, você pode desativar o Row Level Security (RLS)
-- ou criar políticas de acesso público. Abaixo estão comandos rápidos para desativar RLS para facilitar a integração inicial:
ALTER TABLE public.nac_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nac_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nac_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nac_evolutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nac_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nac_logs DISABLE ROW LEVEL SECURITY;
`;
