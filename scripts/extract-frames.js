/**
 * Frame Extractor Script — Concept 5
 *
 * Extracts frames from concept-5-final.mp4 starting at 8s (the scroll-scrub
 * portion). The first 8s plays as an autoplay video intro; everything after
 * is the scroll-driven frame sequence.
 *
 * Run: node scripts/extract-frames.js
 */

const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const VIDEO_PATH  = 'C:/Users/abint/Desktop/UNLTD-project/data-assets/concept-5-final.mp4';
const OUTPUT_DIR  = path.resolve(__dirname, '../public/frames');

/** Video intro portion played by the <video> element (seconds) */
const INTRO_START = 0;
const INTRO_END   = 8;          // hand-off point: video → canvas
const VIDEO_TOTAL = 24.747;     // full video duration (from ffprobe)

/** Scroll-scrub range */
const SCRUB_START  = INTRO_END;
const SCRUB_END    = VIDEO_TOTAL;
const SCRUB_DUR    = SCRUB_END - SCRUB_START;  // ~16.75 s

/** How many frames to extract for the scroll sequence.
 *  ~18 fps over 16.75 s ≈ 300 frames — keeps payload ~= current set. */
const TOTAL_FRAMES = 300;
const FPS          = TOTAL_FRAMES / SCRUB_DUR;

// ── Clear existing frames ───────────────────────────────────────────────────
if (fs.existsSync(OUTPUT_DIR)) {
  const old = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.webp'));
  old.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
  console.log(`🗑  Removed ${old.length} old frames.\n`);
} else {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`🎬  Extracting ${TOTAL_FRAMES} frames`);
console.log(`    Source  : ${VIDEO_PATH}`);
console.log(`    Range   : ${SCRUB_START}s → ${SCRUB_END.toFixed(3)}s  (${SCRUB_DUR.toFixed(3)}s)`);
console.log(`    FPS     : ${FPS.toFixed(4)}`);
console.log(`    Output  : ${OUTPUT_DIR}\n`);

const result = spawnSync(ffmpegPath, [
  '-ss', String(SCRUB_START),     // seek to hand-off point before decoding
  '-i',  VIDEO_PATH,
  '-t',  String(SCRUB_DUR),       // only extract the scrub portion
  '-vf', `scale=1920:-1,fps=${FPS}`,
  '-f',  'image2',
  '-vcodec', 'mjpeg',
  '-q:v', '3',                    // quality 3 ≈ high quality JPEG
  '-frames:v', String(TOTAL_FRAMES),
  '-y',
  path.join(OUTPUT_DIR, 'frame_%04d.jpg'),
], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

if (result.status !== 0) {
  console.error('❌ FFmpeg failed:\n', result.stderr);
  process.exit(1);
}

const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg')).sort();
console.log(`✅ Done! ${files.length} frames extracted.`);
if (files.length > 0) {
  console.log(`   ${files[0]} → ${files[files.length - 1]}\n`);
}
