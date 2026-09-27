alter table lesson_progress
  drop constraint if exists lesson_progress_user_id_fkey;
alter table lesson_progress
  add constraint lesson_progress_user_id_fkey
  foreign key (user_id) references learner_profiles(user_id) on delete cascade;

alter table lesson_sessions
  drop constraint if exists lesson_sessions_user_id_fkey;
alter table lesson_sessions
  add constraint lesson_sessions_user_id_fkey
  foreign key (user_id) references learner_profiles(user_id) on delete cascade;

alter table learning_observations
  drop constraint if exists learning_observations_user_id_fkey;
alter table learning_observations
  add constraint learning_observations_user_id_fkey
  foreign key (user_id) references learner_profiles(user_id) on delete cascade;

alter table relationship_memories
  drop constraint if exists relationship_memories_user_id_fkey;
alter table relationship_memories
  add constraint relationship_memories_user_id_fkey
  foreign key (user_id) references learner_profiles(user_id) on delete cascade;
