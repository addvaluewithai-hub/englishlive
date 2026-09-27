create extension if not exists pgcrypto;

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists course_levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  code text not null,
  title text not null,
  order_index integer not null,
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, code),
  unique (course_id, order_index)
);

create table if not exists course_units (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references course_levels(id) on delete cascade,
  slug text not null unique,
  code text not null,
  title text not null,
  order_index integer not null,
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (level_id, code),
  unique (level_id, order_index)
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references course_units(id) on delete cascade,
  slug text not null unique,
  code text not null,
  order_index integer not null,
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, code),
  unique (unit_id, order_index)
);

create table if not exists lesson_revisions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  revision_number integer not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  schema_version integer not null default 1,
  content jsonb not null,
  created_by text,
  published_by text,
  change_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (lesson_id, revision_number)
);

alter table lessons
  drop constraint if exists lessons_published_revision_id_fkey;
alter table lessons
  add constraint lessons_published_revision_id_fkey
  foreign key (published_revision_id) references lesson_revisions(id) on delete set null;

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  renderer_key text not null,
  status text not null default 'active' check (status in ('active', 'hidden', 'archived')),
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists character_revisions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  revision_number integer not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  schema_version integer not null default 1,
  content jsonb not null,
  created_by text,
  published_by text,
  change_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (character_id, revision_number)
);

alter table characters
  drop constraint if exists characters_published_revision_id_fkey;
alter table characters
  add constraint characters_published_revision_id_fkey
  foreign key (published_revision_id) references character_revisions(id) on delete set null;

create table if not exists teaching_policies (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teaching_policy_revisions (
  id uuid primary key default gen_random_uuid(),
  teaching_policy_id uuid not null references teaching_policies(id) on delete cascade,
  revision_number integer not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  schema_version integer not null default 1,
  content jsonb not null,
  created_by text,
  published_by text,
  change_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (teaching_policy_id, revision_number)
);

alter table teaching_policies
  drop constraint if exists teaching_policies_published_revision_id_fkey;
alter table teaching_policies
  add constraint teaching_policies_published_revision_id_fkey
  foreign key (published_revision_id) references teaching_policy_revisions(id) on delete set null;

create or replace function prevent_published_revision_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' then
    raise exception 'Published revisions are immutable. Create a new revision instead.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists lesson_revisions_immutable_published on lesson_revisions;
create trigger lesson_revisions_immutable_published
before update or delete on lesson_revisions
for each row execute function prevent_published_revision_mutation();

drop trigger if exists character_revisions_immutable_published on character_revisions;
create trigger character_revisions_immutable_published
before update or delete on character_revisions
for each row execute function prevent_published_revision_mutation();

drop trigger if exists teaching_policy_revisions_immutable_published on teaching_policy_revisions;
create trigger teaching_policy_revisions_immutable_published
before update or delete on teaching_policy_revisions
for each row execute function prevent_published_revision_mutation();

create table if not exists learner_profiles (
  user_id text primary key,
  first_name text,
  native_language text,
  interface_locale text not null default 'ar-EG',
  goals text[] not null default '{}',
  comfort_level text,
  selected_character_id uuid references characters(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lesson_progress (
  user_id text not null,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  first_started_at timestamptz,
  last_started_at timestamptz,
  completed_at timestamptz,
  last_session_id uuid,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  lesson_id uuid not null references lessons(id) on delete restrict,
  lesson_revision_id uuid not null references lesson_revisions(id) on delete restrict,
  character_id uuid not null references characters(id) on delete restrict,
  character_revision_id uuid not null references character_revisions(id) on delete restrict,
  teaching_policy_revision_id uuid not null references teaching_policy_revisions(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned', 'error')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  client_context jsonb not null default '{}'::jsonb
);

alter table lesson_progress
  drop constraint if exists lesson_progress_last_session_id_fkey;
alter table lesson_progress
  add constraint lesson_progress_last_session_id_fkey
  foreign key (last_session_id) references lesson_sessions(id) on delete set null;

create table if not exists scene_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references lesson_sessions(id) on delete cascade,
  scene_id text not null,
  scene_index integer not null check (scene_index >= 0),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique (session_id, scene_id)
);

create table if not exists learning_observations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  lesson_id uuid references lessons(id) on delete set null,
  session_id uuid references lesson_sessions(id) on delete set null,
  scene_id text,
  observation_type text not null check (observation_type in ('successful_use', 'needs_more_practice', 'exposure')),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists relationship_memories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  character_id uuid not null references characters(id) on delete cascade,
  category text not null check (category in ('follow_up', 'preference', 'interest')),
  note text not null check (char_length(note) <= 300),
  source_session_id uuid references lesson_sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_course_units_level_order on course_units(level_id, order_index);
create index if not exists idx_lessons_unit_order on lessons(unit_id, order_index);
create index if not exists idx_lesson_revisions_lesson_status on lesson_revisions(lesson_id, status, revision_number desc);
create index if not exists idx_character_revisions_character_status on character_revisions(character_id, status, revision_number desc);
create index if not exists idx_policy_revisions_policy_status on teaching_policy_revisions(teaching_policy_id, status, revision_number desc);
create index if not exists idx_lesson_sessions_user_started on lesson_sessions(user_id, started_at desc);
create index if not exists idx_lesson_sessions_lesson_revision on lesson_sessions(lesson_revision_id);
create index if not exists idx_scene_results_session on scene_results(session_id, scene_index);
create index if not exists idx_learning_observations_user_created on learning_observations(user_id, created_at desc);
create index if not exists idx_relationship_memories_user_character on relationship_memories(user_id, character_id, created_at desc) where archived_at is null;
