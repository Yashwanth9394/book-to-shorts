#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate silent placeholder music files
 * These are temporary files until user adds real music
 */

const musicFiles = [
  'dark-tension.mp3',
  'suspense-rising.mp3',
  'dramatic-climax.mp3',
  'revelation.mp3',
  'wisdom-theme.mp3',
  'modern-relevance.mp3',
  'cta-energy.mp3',
  'epic-intro.mp3',
  'mysterious.mp3',
  'action-theme.mp3',
  '_placeholder.mp3' // Default fallback
];

const musicPath = path.resolve(__dirname, '../data/assets/music');

/**
 * Create a minimal valid MP3 file (1 second of silence)
 * This is a valid MP3 that audio players can read
 */
function createSilentMP3(outputPath, durationSeconds = 1) {
  // Minimal MP3 header for silence
  // MPEG-1 Layer 3, 128kbps, 44.1kHz
  const frameHeader = Buffer.from([
    0xFF, 0xFB, // Frame sync + MPEG version + Layer
    0x90, 0x00, // Bitrate + Sample rate + Padding
  ]);

  // Calculate number of frames needed
  // At 128kbps, each frame is 417 bytes and represents ~26ms
  const framesNeeded = Math.ceil(durationSeconds * 38.28); // ~38 frames per second
  const frameSize = 417;

  // Create silent frame (header + zeros)
  const silentFrame = Buffer.alloc(frameSize);
  frameHeader.copy(silentFrame, 0);

  // Concatenate frames
  const frames = [];
  for (let i = 0; i < framesNeeded; i++) {
    frames.push(silentFrame);
  }

  const silentMP3 = Buffer.concat(frames);
  fs.writeFileSync(outputPath, silentMP3);
}

async function generatePlaceholderMusic() {
  console.log('🎵 Generating placeholder music files...\n');

  // Ensure directory exists
  await fs.ensureDir(musicPath);

  let created = 0;
  let skipped = 0;

  for (const musicFile of musicFiles) {
    const filePath = path.join(musicPath, musicFile);

    if (fs.existsSync(filePath)) {
      console.log(`⏭️  ${musicFile} (already exists)`);
      skipped++;
    } else {
      createSilentMP3(filePath, 60); // 60 seconds of silence
      console.log(`✅ ${musicFile} (created - silent placeholder)`);
      created++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${musicFiles.length}`);

  console.log(`\n📁 Location: ${musicPath}`);

  console.log(`\n⚠️  IMPORTANT:`);
  console.log(`   These are SILENT placeholder files.`);
  console.log(`   Replace them with real music for production videos.`);
  console.log(`\n💡 Music Sources:`);
  console.log(`   • YouTube Audio Library (free): https://youtube.com/audiolibrary`);
  console.log(`   • Epidemic Sound (paid): https://epidemicsound.com`);
  console.log(`   • Artlist (paid): https://artlist.io`);
  console.log(`\n📖 See docs/MUSIC-GUIDE.md for detailed instructions\n`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePlaceholderMusic().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export default generatePlaceholderMusic;
