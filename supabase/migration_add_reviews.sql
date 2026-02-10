-- Migration: Add review management and notifications system
-- Run this in your Supabase SQL Editor to add review (مراجعة) functionality

-- Step 1: Add WhatsApp number to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Step 2: Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  review_number integer NOT NULL,
  review_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, review_number)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage all reviews"
  ON reviews FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Students can view own reviews"
  ON reviews FOR SELECT USING (student_id = auth.uid());

-- Step 3: Create review_surahs junction table
CREATE TABLE IF NOT EXISTS review_surahs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  surah text NOT NULL,
  completed boolean DEFAULT false,
  score integer CHECK (score >= 0 AND score <= 100),
  errors integer DEFAULT 0,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_surahs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage review surahs"
  ON review_surahs FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reviews r
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE r.id = review_surahs.review_id AND p.role = 'teacher'
    )
  );

CREATE POLICY "Students can view own review surahs"
  ON review_surahs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_surahs.review_id AND r.student_id = auth.uid()
    )
  );

-- Step 4: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('review_assigned', 'review_reminder', 'review_due', 'achievement')),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  read boolean DEFAULT false,
  sent_whatsapp boolean DEFAULT false,
  whatsapp_status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Teachers can create notifications"
  ON notifications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_student ON reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_review_surahs_review ON review_surahs(review_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- Step 6: Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE review_surahs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 7: Create a function to auto-update review status
CREATE OR REPLACE FUNCTION update_review_status()
RETURNS trigger AS $$
BEGIN
  -- Check if all surahs in the review are completed
  IF (SELECT COUNT(*) FROM review_surahs WHERE review_id = NEW.review_id AND completed = false) = 0 THEN
    UPDATE reviews SET status = 'completed', updated_at = now() WHERE id = NEW.review_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_surah_update
  AFTER UPDATE ON review_surahs
  FOR EACH ROW EXECUTE FUNCTION update_review_status();
