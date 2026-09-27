const SPRITE_PREFIX = 'https://res.cloudinary.com/as9o12al/image/upload/';
const SPRITE_FILE = 'v1790511309/englotti-learn-assets/englotti-assets-sprite.png';

function crop(x: number, y: number, width: number, height: number) {
  return `${SPRITE_PREFIX}c_crop,x_${x},y_${y},w_${width},h_${height}/f_auto,q_auto/${SPRITE_FILE}`;
}

/**
 * Crops from the exact design asset sheet supplied for the learning journey.
 * Keeping one source sprite makes the exported artwork easy to replace later
 * without coupling the course data to presentation assets.
 */
export const learnArt = {
  mascotNeutral: crop(50, 30, 280, 210),
  mascotReading: crop(340, 20, 310, 220),
  mascotWave: crop(40, 240, 300, 220),
  mascotHeadset: crop(350, 240, 300, 220),
  books: crop(40, 450, 300, 180),
  hiBubble: crop(360, 450, 300, 190),
  star: crop(80, 610, 230, 180),
  cloud: crop(350, 620, 310, 170),
  chatCloud: crop(35, 785, 305, 205),
  bigBen: crop(350, 770, 310, 220),
  purpleNoteCloud: crop(35, 1000, 310, 190),
  mountainFlag: crop(350, 975, 310, 210),
  trophy: crop(35, 1180, 310, 220),
  treeBushes: crop(375, 1170, 270, 235),
  rewardChest: crop(65, 1375, 240, 200),
  lockedChest: crop(370, 1390, 280, 200),
  signpost: crop(35, 1560, 310, 265),
  mascotBushLove: crop(340, 1570, 320, 255),
  lessonBoard: crop(25, 1810, 330, 220),
  foliageCloud: crop(345, 1820, 315, 220),
} as const;
