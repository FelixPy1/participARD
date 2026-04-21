/*
  # Base Database Schema for ParticipARD
  
  ## Overview
  Sistema de administración de actividades educativas con control de roles y seguridad.
  
  ## New Tables
  - `profiles`: Información de usuarios (estudiantes, instituciones, administradores)
  - `institutions`: Instituciones participantes
  - `activity_types`: Tipos de actividades (concursos, becas, ferias, eventos)
  - `activities`: Actividades disponibles
  - `activity_enrollments`: Inscripciones de estudiantes
  - `activity_logs`: Logs del sistema para monitoreo
  - `system_alerts`: Alertas generadas automáticamente
  
  ## Security
  - RLS habilitado en todas las tablas
  - Políticas restrictivas por rol de usuario
  - Segregación de datos por usuario/institución
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'student' CHECK (role IN ('admin', 'institution', 'student')),
  institution_id uuid,
  province text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  province text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view institutions"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage institutions"
  ON institutions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Institution owners can update own"
  ON institutions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND institution_id = institutions.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND institution_id = institutions.id
    )
  );

-- Create activity types
CREATE TABLE IF NOT EXISTS activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity types"
  ON activity_types FOR SELECT
  USING (true);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type_id uuid REFERENCES activity_types(id),
  institution_id uuid REFERENCES institutions(id),
  start_date timestamptz,
  end_date timestamptz,
  location text,
  province text,
  max_enrollments integer DEFAULT 100,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active activities"
  ON activities FOR SELECT
  USING (status = 'active');

CREATE POLICY "Institution can view own activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND institution_id = activities.institution_id
    )
  );

CREATE POLICY "Admins can view all activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Institution can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'institution' OR role = 'admin')
    )
  );

CREATE POLICY "Institution can update own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create enrollments table
CREATE TABLE IF NOT EXISTS activity_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'cancelled')),
  enrollment_date timestamptz DEFAULT now(),
  UNIQUE(activity_id, student_id)
);

ALTER TABLE activity_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own enrollments"
  ON activity_enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Institution can view enrollments in own activities"
  ON activity_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities WHERE activities.id = activity_id AND 
      institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all enrollments"
  ON activity_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can enroll in activities"
  ON activity_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  details jsonb,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create system alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text,
  related_table text,
  related_record_id uuid,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts"
  ON system_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can resolve alerts"
  ON system_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_activities_institution_id ON activities(institution_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_type_id ON activities(type_id);
CREATE INDEX IF NOT EXISTS idx_activities_province ON activities(province);
CREATE INDEX IF NOT EXISTS idx_enrollments_activity_id ON activity_enrollments(activity_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON activity_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON activity_logs(timestamp);
