export type OttiPortraitPose = 'idle' | 'wave' | 'proud' | 'celebrate';

function namespaceSvgIds(svg: string, prefix: string) {
  if (!prefix) return svg;

  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '');
  return svg
    .replace(/\bid="([^"]+)"/g, (_match, id: string) => `id="${safePrefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_match, id: string) => `url(#${safePrefix}${id})`)
    .replace(/\bhref="#([^"]+)"/g, (_match, id: string) => `href="#${safePrefix}${id}"`)
    .replace(/\baria-labelledby="([^"]+)"/g, (_match, ids: string) =>
      `aria-labelledby="${ids.split(/\s+/).map((id) => `${safePrefix}${id}`).join(' ')}"`,
    );
}

export function renderOttiSvg({
  pose = 'idle',
  className = '',
  portrait = true,
  prefix = '',
}: {
  pose?: OttiPortraitPose;
  className?: string;
  portrait?: boolean;
  prefix?: string;
} = {}) {
  if (!window.OctopusAnatomy) {
    throw new Error('Bundled PixiLive Octo anatomy did not load.');
  }

  const classes = ['otti-svg', `otti-pose-${pose}`, className]
    .filter(Boolean)
    .join(' ');
  const original = window.OctopusAnatomy.render({ name: 'Otti' }, portrait);
  const withClass = original.replace('<svg ', `<svg class="${classes}" `);

  // PixiLive's live rig intentionally uses stable IDs. Static product portraits
  // can coexist with headers/cards, so only static markup gets an ID namespace.
  return namespaceSvgIds(withClass, prefix);
}
