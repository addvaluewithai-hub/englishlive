import { neon } from '@neondatabase/serverless';
import { characterRegistry } from '../src/character/registry';
import { DEFAULT_TEACHING_POLICY } from '../src/content/defaultTeachingPolicy';
import { A1_U1_L01_SCENE_LESSON } from '../src/lessonScenes/a1/u1l1';
import { A1_U1_L02_SCENE_LESSON } from '../src/lessonScenes/a1/u1l2';
import { A1_U1_L03_SCENE_LESSON } from '../src/lessonScenes/a1/u1l3';

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error('DATABASE_URL is required to seed Neon.');

const sql = neon(connectionString);
const lessons = [A1_U1_L01_SCENE_LESSON, A1_U1_L02_SCENE_LESSON, A1_U1_L03_SCENE_LESSON];

function rendererKey(character: (typeof characterRegistry)[number]) {
  const renderer = character.renderer;
  if (renderer.kind === 'otti-svg') return 'octo';
  if (renderer.kind === 'svg-human') return `human:${renderer.preset}`;
  if (renderer.kind === 'svg-mascot') return `mascot:${renderer.preset}`;
  return `recipe:${renderer.species}`;
}

async function main() {
  const [course] = await sql`
    insert into courses (slug, title, status)
    values ('englotti-english', 'Englotti English', 'active')
    on conflict (slug) do update set title = excluded.title, status = excluded.status, updated_at = now()
    returning id::text as id
  `;

  const [level] = await sql`
    insert into course_levels (course_id, code, title, order_index, status)
    values (${course.id}::uuid, 'A1', 'A1', 1, 'active')
    on conflict (course_id, code) do update
      set title = excluded.title, order_index = excluded.order_index, status = excluded.status, updated_at = now()
    returning id::text as id
  `;

  const [unit] = await sql`
    insert into course_units (level_id, slug, code, title, order_index, status)
    values (${level.id}::uuid, 'a1-u1-first-contact', 'U1', 'First Contact: Me and You', 1, 'active')
    on conflict (slug) do update
      set level_id = excluded.level_id, code = excluded.code, title = excluded.title,
          order_index = excluded.order_index, status = excluded.status, updated_at = now()
    returning id::text as id
  `;

  for (const lesson of lessons) {
    const [row] = await sql`
      insert into lessons (unit_id, slug, code, order_index, status)
      values (${unit.id}::uuid, ${lesson.id}, ${lesson.source.sourceLessonId}, ${lesson.order}, 'active')
      on conflict (slug) do update
        set unit_id = excluded.unit_id, code = excluded.code, order_index = excluded.order_index,
            status = excluded.status, updated_at = now()
      returning id::text as id, published_revision_id::text as published_revision_id
    `;

    if (!row.published_revision_id) {
      const [revision] = await sql`
        insert into lesson_revisions (
          lesson_id, revision_number, status, schema_version, content,
          change_note, published_at
        )
        values (
          ${row.id}::uuid, 1, 'published', 1, ${JSON.stringify(lesson)}::jsonb,
          'Initial import from the first three Englotti scene lessons', now()
        )
        returning id::text as id
      `;
      await sql`update lessons set published_revision_id = ${revision.id}::uuid, updated_at = now() where id = ${row.id}::uuid`;
      console.log(`published lesson ${lesson.id} revision 1`);
    } else {
      console.log(`kept existing published lesson ${lesson.id}`);
    }
  }

  for (const character of characterRegistry) {
    const [row] = await sql`
      insert into characters (slug, renderer_key, status)
      values (${character.id}, ${rendererKey(character)}, 'active')
      on conflict (slug) do update
        set renderer_key = excluded.renderer_key, status = excluded.status, updated_at = now()
      returning id::text as id, published_revision_id::text as published_revision_id
    `;

    if (!row.published_revision_id) {
      const content = {
        displayName: character.name,
        tagline: character.tagline,
        description: character.description,
        accent: character.accent,
        personaPrompt: character.persona.style,
        teachingStylePrompt: '',
        voiceName: null,
      };
      const [revision] = await sql`
        insert into character_revisions (
          character_id, revision_number, status, schema_version, content,
          change_note, published_at
        )
        values (
          ${row.id}::uuid, 1, 'published', 1, ${JSON.stringify(content)}::jsonb,
          'Initial import from the PixiLive-backed Englotti character registry', now()
        )
        returning id::text as id
      `;
      await sql`update characters set published_revision_id = ${revision.id}::uuid, updated_at = now() where id = ${row.id}::uuid`;
      console.log(`published character ${character.id} revision 1`);
    } else {
      console.log(`kept existing published character ${character.id}`);
    }
  }

  const [policy] = await sql`
    insert into teaching_policies (key)
    values ('default')
    on conflict (key) do update set updated_at = now()
    returning id::text as id, published_revision_id::text as published_revision_id
  `;

  if (!policy.published_revision_id) {
    const [revision] = await sql`
      insert into teaching_policy_revisions (
        teaching_policy_id, revision_number, status, schema_version, content,
        change_note, published_at
      )
      values (
        ${policy.id}::uuid, 1, 'published', 1, ${JSON.stringify(DEFAULT_TEACHING_POLICY)}::jsonb,
        'Initial global Englotti teaching policy', now()
      )
      returning id::text as id
    `;
    await sql`update teaching_policies set published_revision_id = ${revision.id}::uuid, updated_at = now() where id = ${policy.id}::uuid`;
    console.log('published teaching policy default revision 1');
  } else {
    console.log('kept existing published teaching policy default');
  }

  console.log('Neon seed complete.');
}

await main();
