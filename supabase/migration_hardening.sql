-- ╔════════════════════════════════════════════════════════════╗
-- ║  Migration: Authentication Hardening                      ║
-- ║  Run in Supabase SQL Editor after schema.sql              ║
-- ╚════════════════════════════════════════════════════════════╝

-- ─── Add email column to profiles ──────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- ─── Widen notifications type constraint ───────────────────
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('review_assigned', 'review_reminder', 'review_due', 'achievement', 'user_signup_request'));

-- ─── Auto-create profile on auth.users insert ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, status, preferred_language, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'pending',
    COALESCE(NEW.raw_user_meta_data->>'language', 'ar'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Seed initial admin user ───────────────────────────────
-- IMPORTANT: Change email and password before running!
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  raw_user_meta_data, raw_app_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@qurantracker.app',
  crypt('changeme123', gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"username": "admin", "full_name": "Admin", "role": "admin"}',
  '{"provider": "email", "providers": ["email"]}',
  now(), now()
);

-- The trigger above will auto-create the profile, but we ensure role is admin:
INSERT INTO public.profiles (id, username, full_name, role, status, preferred_language, email)
SELECT id, 'admin', 'Admin', 'admin', 'active', 'ar', email
FROM auth.users WHERE email = 'admin@qurantracker.app'
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
