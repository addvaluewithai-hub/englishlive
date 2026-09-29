create table if not exists speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references learner_profiles(user_id) on delete cascade,
  scenario_id text not null,
  difficulty text not null default 'recommended' check (difficulty in ('easier', 'recommended', 'challenge')),
  character_id uuid not null references characters(id) on delete restrict,
  character_revision_id uuid not null references character_revisions(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned', 'error')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  scenario_snapshot jsonb not null default '{}'::jsonb,
  transcript jsonb not null default '[]'::jsonb,
  analysis jsonb,
  analysis_status text not null default 'pending' check (analysis_status in ('pending', 'complete', 'error')),
  analysis_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_speaking_sessions_user_started
  on speaking_sessions(user_id, started_at desc);

create index if not exists idx_speaking_sessions_user_completed
  on speaking_sessions(user_id, ended_at desc)
  where status = 'completed';

create index if not exists idx_speaking_sessions_scenario
  on speaking_sessions(scenario_id, started_at desc);

create table if not exists speaking_session_evidence (
  id bigserial primary key,
  session_id uuid not null references speaking_sessions(id) on delete cascade,
  user_id text not null references learner_profiles(user_id) on delete cascade,
  skill_id text not null,
  outcome text not null check (outcome in ('demonstrated', 'emerging', 'not_observed')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, skill_id)
);

create index if not exists idx_speaking_evidence_user_skill
  on speaking_session_evidence(user_id, skill_id, created_at desc);

create index if not exists idx_speaking_evidence_session
  on speaking_session_evidence(session_id);
