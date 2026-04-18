-- Migration: Add class/group management and teacher approval status

-- Step 1: Add profile status for teacher approval
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected'));

-- Step 2: Create classes table for teacher groups
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own classes"
  ON classes FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Teachers and members can view classes"
  ON classes FOR SELECT USING (
    teacher_id = auth.uid() OR EXISTS (
      SELECT 1 FROM class_members cm WHERE cm.class_id = classes.id AND cm.student_id = auth.uid()
    )
  );

-- Step 3: Create class membership table
CREATE TABLE IF NOT EXISTS class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, student_id)
);

ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage class members"
  ON class_members FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes c WHERE c.id = class_members.class_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own class memberships"
  ON class_members FOR SELECT USING (student_id = auth.uid());

-- Step 4: Add realtime publication for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE classes;
ALTER PUBLICATION supabase_realtime ADD TABLE class_members;

-- Step 5: Add indexes for class related performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);
