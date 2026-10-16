import type { ComponentType } from 'react';
import { TeacherLabVisual } from '../lessonScenes/TeacherLabVisual';
import { A1FirstMeetingVisual } from '../lessonScenes/a1/A1FirstMeetingVisual';

/** Authoring registry: every independently produced lesson MUST supply bespoke art. */
const VISUALS: Readonly<Record<string, ComponentType<{sceneId:string;beatId:string}>>> = {
  'b1-relationship-journey': TeacherLabVisual,
  'a1-first-meeting': A1FirstMeetingVisual,
};

export function getQaLessonVisual(key:string):ComponentType<{sceneId:string;beatId:string}> {
  const Visual = VISUALS[key];
  if (!Visual) throw new Error('No bespoke registered semantic art for QA lesson: '+key);
  return Visual;
}
