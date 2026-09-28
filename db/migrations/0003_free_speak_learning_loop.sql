create table if not exists free_speak_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references learner_profiles(user_id) on delete cascade,
  mode_id text not null check (mode_id in ('just-chat', 'work', 'travel', 'interview')),
  character_id uuid not null references characters(id) on delete restrict,
  character_revision_id uuid not null references character_revisions(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned', 'error')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  transcript jsonb not null default '[]'::jsonb,
  analysis jsonb,
  analysis_status text not null default 'pending' check (analysis_status in ('pending', 'complete', 'error')),
  analysis_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_free_speak_sessions_user_started
  on free_speak_sessions(user_id, started_at desc);

create index if not exists idx_free_speak_sessions_user_completed
  on free_speak_sessions(user_id, ended_at desc)
  where status = 'completed';
