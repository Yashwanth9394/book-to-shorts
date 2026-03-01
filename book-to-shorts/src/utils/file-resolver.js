import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File resolver with graceful fallbacks
 * Handles missing assets by using placeholders instead of crashing
 */
class FileResolver {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.cache = new Map();
    this.warnings = [];
  }

  /**
   * Resolve file path with fallback
   * @param {string} relativePath - Relative path from assets folder
   * @param {string} type - Asset type: 'images', 'audio', 'music'
   * @returns {string} Absolute file path (or fallback)
   */
  resolve(relativePath, type) {
    if (!relativePath) {
      return this.getFallback(type);
    }

    // Build full path
    const fullPath = path.join(this.projectRoot, 'data/assets', type, relativePath);

    // Check cache
    const cacheKey = `${type}:${relativePath}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if file exists
    if (fs.existsSync(fullPath)) {
      this.cache.set(cacheKey, fullPath);
      return fullPath;
    }

    // File missing - log warning and return fallback
    const warning = `Missing ${type}: ${relativePath}`;
    if (!this.warnings.includes(warning)) {
      this.warnings.push(warning);
      console.warn(`⚠️  ${warning}`);
      console.warn(`   Expected at: ${fullPath}`);
      console.warn(`   Using fallback instead`);
    }

    const fallback = this.getFallback(type);
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  /**
   * Get fallback file for asset type
   */
  getFallback(type) {
    const fallbackPath = path.join(this.projectRoot, 'data/assets', type, `_placeholder.${this.getExtension(type)}`);

    // Ensure fallback exists
    if (!fs.existsSync(fallbackPath)) {
      this.createFallback(type, fallbackPath);
    }

    return fallbackPath;
  }

  /**
   * Get file extension for asset type
   */
  getExtension(type) {
    const extensions = {
      'images': 'jpg',
      'audio': 'mp3',
      'music': 'mp3'
    };
    return extensions[type] || 'dat';
  }

  /**
   * Create placeholder file
   */
  createFallback(type, fallbackPath) {
    fs.ensureDirSync(path.dirname(fallbackPath));

    if (type === 'images') {
      this.createPlaceholderImage(fallbackPath);
    } else if (type === 'audio' || type === 'music') {
      this.createSilentAudio(fallbackPath);
    }
  }

  /**
   * Create a simple placeholder image (solid color)
   */
  createPlaceholderImage(outputPath) {
    // Create a simple SVG placeholder
    const svg = `
      <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#grad)"/>
        <text x="540" y="960" font-family="Arial" font-size="48" fill="#666" text-anchor="middle">
          [Image Placeholder]
        </text>
      </svg>
    `.trim();

    // For now, create a marker file
    // In production, you'd use canvas or sharp to create actual image
    fs.writeFileSync(outputPath.replace('.jpg', '.svg'), svg);
    fs.writeFileSync(outputPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0])); // Minimal JPEG header
    console.log(`Created placeholder image: ${outputPath}`);
  }

  /**
   * Create silent audio file (1 second of silence)
   */
  createSilentAudio(outputPath) {
    // Minimal MP3 header for 1 second of silence
    // In production, use ffmpeg or audio library
    const silentMp3Header = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00
    ]);

    fs.writeFileSync(outputPath, silentMp3Header);
    console.log(`Created silent audio: ${outputPath}`);
  }

  /**
   * Validate that all required files exist for a script
   * @param {object} script - Script JSON object
   * @returns {object} Validation result
   */
  validateScript(script) {
    const results = {
      valid: true,
      missing: {
        images: [],
        audio: [],
        music: []
      }
    };

    const shortId = String(script.short_id).padStart(3, '0');

    for (const scene of script.scenes) {
      const sceneNum = scene.scene_number;

      // Check audio
      if (scene.audio?.narration_text) {
        const audioFile = `short_${shortId}_scene_${sceneNum}.mp3`;
        const audioPath = path.join(this.projectRoot, 'data/assets/audio', audioFile);
        if (!fs.existsSync(audioPath)) {
          results.missing.audio.push(audioFile);
          results.valid = false;
        }
      }

      // Check image
      if (scene.visuals?.image_needed) {
        const imageFile = `short_${shortId}_scene_${sceneNum}.jpg`;
        const imagePath = path.join(this.projectRoot, 'data/assets/images', imageFile);
        if (!fs.existsSync(imagePath)) {
          results.missing.images.push(imageFile);
          results.valid = false;
        }
      }

      // Check music
      if (scene.audio?.background_music) {
        const musicPath = path.join(this.projectRoot, 'data/assets/music', scene.audio.background_music);
        if (!fs.existsSync(musicPath)) {
          if (!results.missing.music.includes(scene.audio.background_music)) {
            results.missing.music.push(scene.audio.background_music);
          }
          results.valid = false;
        }
      }
    }

    return results;
  }

  /**
   * Get all warnings
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Clear warnings
   */
  clearWarnings() {
    this.warnings = [];
  }
}

// Singleton instance
const fileResolver = new FileResolver();

export { FileResolver };
export default fileResolver;
