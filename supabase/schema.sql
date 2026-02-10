-- ╔════════════════════════════════════════════════════════════╗
-- ║  Quran Tracker – Supabase Database Schema                ║
-- ║  Run this in the Supabase SQL Editor to set up tables    ║
-- ╚════════════════════════════════════════════════════════════╝

-- ─── Users / Profiles ──────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null check (role in ('teacher', 'student')),
  avatar_url text,
  streak_count integer default 0,
  last_active_date date,
  preferred_language text default 'ar',
  dark_mode boolean default false,
  notification_enabled boolean default false,
  notification_time text default '06:00',
  whatsapp_number text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view all profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- ─── Recitation Records ────────────────────────────────────
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  teacher_id uuid references profiles(id) on delete set null,
  surah text not null,
  score integer not null check (score >= 0 and score <= 100),
  errors integer not null default 0,
  error_verses text,
  notes text,
  review_start_date date,
  completed boolean default false,
  completion_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table records enable row level security;

create policy "Teachers can do everything with records"
  on records for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

create policy "Students can view own records"
  on records for select using (student_id = auth.uid());

-- ─── Daily Activity (for streaks & heatmap) ────────────────
create table if not exists daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  activity_date date not null default current_date,
  records_count integer default 0,
  total_score integer default 0,
  created_at timestamptz default now(),
  unique(user_id, activity_date)
);

alter table daily_activity enable row level security;

create policy "Users can view own activity"
  on daily_activity for select using (user_id = auth.uid());

create policy "Users can insert own activity"
  on daily_activity for insert with check (user_id = auth.uid());

create policy "Users can update own activity"
  on daily_activity for update using (user_id = auth.uid());

create policy "Teachers can view all activity"
  on daily_activity for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

-- ─── Goals ─────────────────────────────────────────────────
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  target_surahs integer default 1,
  target_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table goals enable row level security;

create policy "Users can manage own goals"
  on goals for all using (user_id = auth.uid());

-- ─── Indexes ───────────────────────────────────────────────
create index if not exists idx_records_student on records(student_id);
create index if not exists idx_records_teacher on records(teacher_id);
create index if not exists idx_activity_user_date on daily_activity(user_id, activity_date);
create index if not exists idx_goals_user on goals(user_id);

-- ─── Realtime ──────────────────────────────────────────────
alter publication supabase_realtime add table records;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table daily_activity;

-- ─── Function: Update streak ───────────────────────────────
create or replace function update_streak()
returns trigger as $$
declare
  prev_date date;
  current_streak integer;
begin
  select last_active_date, streak_count
    into prev_date, current_streak
    from profiles where id = new.user_id;

  if prev_date = current_date - interval '1 day' then
    update profiles set
      streak_count = current_streak + 1,
      last_active_date = current_date
    where id = new.user_id;
  elsif prev_date is null or prev_date < current_date - interval '1 day' then
    update profiles set
      streak_count = 1,
      last_active_date = current_date
    where id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_activity_insert
  after insert on daily_activity
  for each row execute function update_streak();

-- ─── Reviews (مراجعة) ──────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  review_number integer not null,
  review_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'missed')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, review_number)
);

alter table reviews enable row level security;

create policy "Teachers can manage all reviews"
  on reviews for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

create policy "Students can view own reviews"
  on reviews for select using (student_id = auth.uid());

-- ─── Review Surahs (junction table) ────────────────────────
create table if not exists review_surahs (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  surah text not null,
  completed boolean default false,
  score integer check (score >= 0 and score <= 100),
  errors integer default 0,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table review_surahs enable row level security;

create policy "Teachers can manage review surahs"
  on review_surahs for all using (
    exists (
      select 1 from reviews r
      inner join profiles p on p.id = auth.uid()
      where r.id = review_surahs.review_id and p.role = 'teacher'
    )
  );

create policy "Students can view own review surahs"
  on review_surahs for select using (
    exists (
      select 1 from reviews r
      where r.id = review_surahs.review_id and r.student_id = auth.uid()
    )
  );

-- ─── Notifications ──────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('review_assigned', 'review_reminder', 'review_due', 'achievement')),
  title text not null,
  message text not null,
  related_id uuid,
  read boolean default false,
  sent_whatsapp boolean default false,
  whatsapp_status text,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Users can view own notifications"
  on notifications for select using (user_id = auth.uid());

create policy "Users can update own notifications"
  on notifications for update using (user_id = auth.uid());

create policy "Teachers can create notifications"
  on notifications for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

-- ─── Additional Indexes ─────────────────────────────────────
create index if not exists idx_reviews_student on reviews(student_id);
create index if not exists idx_reviews_teacher on reviews(teacher_id);
create index if not exists idx_reviews_date on reviews(review_date);
create index if not exists idx_review_surahs_review on review_surahs(review_id);
create index if not exists idx_notifications_user on notifications(user_id, read);

-- ─── Realtime for new tables ───────────────────────────────
alter publication supabase_realtime add table reviews;
alter publication supabase_realtime add table review_surahs;
alter publication supabase_realtime add table notifications;
