/**
 * Frame Extractor Script — Concept 5
 * Extracts exactly 150 JPEG frames from concept-6-new.mp4.
 * Output: public/frames/frame_0001.jpg → frame_0150.jpg
 *
 * Run: node scripts/extract-frames.js
 */

const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const VIDEO_PATH = 'C:/Users/abint/Desktop/UNLTD-project/data-assets/concept-6-new.mp4';
const OUTPUT_DIR = path.resolve(__dirname, '../public/frames');
const TOTAL_FRAMES = 150;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`\n🎬 Extracting ${TOTAL_FRAMES} frames from: ${VIDEO_PATH}`);
console.log(`📁 Output: ${OUTPUT_DIR}\n`);

// Get duration via ffmpeg stderr
const probeResult = spawnSync(ffmpegPath, ['-i', VIDEO_PATH, '-hide_banner'], { encoding: 'utf8' });
const durationMatch = (probeResult.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
if (!durationMatch) { console.error('❌ Cannot parse duration'); process.exit(1); }

const duration = parseFloat(durationMatch[1]) * 3600 + parseFloat(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
const fps = TOTAL_FRAMES / duration;
console.log(`⏱  Duration: ${duration.toFixed(2)}s  |  Target FPS: ${fps.toFixed(4)}\n▶️  Running FFmpeg...\n`);

const result = spawnSync(ffmpegPath, [
  '-i', VIDEO_PATH,
  '-vf', `scale=1920:-1,fps=${fps}`,
  '-f', 'image2',
  '-vcodec', 'mjpeg',
  '-q:v', '3',
  '-frames:v', String(TOTAL_FRAMES),
  '-y',
  path.join(OUTPUT_DIR, 'frame_%04d.jpg'),
], { encoding: 'utf8' });

if (result.status !== 0) { console.error('❌ FFmpeg failed:\n', result.stderr); process.exit(1); }

const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg')).sort();
console.log(`✅ Done! ${files.length} frames extracted.`);
console.log(`   ${files[0]} → ${files[files.length - 1]}\n`);
