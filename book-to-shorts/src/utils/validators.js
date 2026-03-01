import config from '../config/config.js';
import { fileExists } from './file-utils.js';
import fs from 'fs-extra';

/**
 * Validate master analysis JSON structure
 * @param {Object} data - Master analysis data
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
export function validateMasterAnalysis(data) {
  const errors = [];

  // Check top-level structure
  if (!data.book_info) {
    errors.push('Missing book_info object');
  } else {
    if (!data.book_info.title) errors.push('Missing book_info.title');
    if (!data.book_info.author) errors.push('Missing book_info.author');
  }

  if (!data.style_guide) {
    errors.push('Missing style_guide object');
  } else {
    if (!data.style_guide.tone) errors.push('Missing style_guide.tone');
    if (!data.style_guide.pacing) errors.push('Missing style_guide.pacing');
  }

  if (!data.viral_stories || !Array.isArray(data.viral_stories)) {
    errors.push('Missing or invalid viral_stories array');
  } else {
    // Check we have exactly 25 stories
    if (data.viral_stories.length !== config.limits.targetStories) {
      errors.push(
        `Expected ${config.limits.targetStories} stories, got ${data.viral_stories.length}`
      );
    }

    // Validate each story
    data.viral_stories.forEach((story, index) => {
      if (!story.story_id) {
        errors.push(`Story ${index + 1}: Missing story_id`);
      }
      if (!story.title) {
        errors.push(`Story ${index + 1}: Missing title`);
      }
      if (!story.plot_summary) {
        errors.push(`Story ${index + 1}: Missing plot_summary`);
      }
      if (!story.viral_potential) {
        errors.push(`Story ${index + 1}: Missing viral_potential`);
      } else {
        const vp = story.viral_potential;
        if (typeof vp.shock_value !== 'number') {
          errors.push(`Story ${index + 1}: Invalid viral_potential.shock_value`);
        }
        if (typeof vp.total_score !== 'number') {
          errors.push(`Story ${index + 1}: Invalid viral_potential.total_score`);
        }
      }
      if (!story.hook_options || !Array.isArray(story.hook_options)) {
        errors.push(`Story ${index + 1}: Missing or invalid hook_options`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate script JSON structure
 * @param {Object} data - Script data
 * @returns {Object} { valid: boolean, errors: Array<string>, warnings: Array<string> }
 */
export function validateScript(data) {
  const errors = [];
  const warnings = [];

  // Check top-level structure
  if (!data.short_id) errors.push('Missing short_id');
  if (!data.title) errors.push('Missing title');
  if (!data.timeline) {
    errors.push('Missing timeline object');
  } else {
    if (typeof data.timeline.total_duration_ms !== 'number') {
      errors.push('Invalid timeline.total_duration_ms');
    } else {
      const duration = data.timeline.total_duration_ms;
      if (duration < config.limits.minDuration) {
        warnings.push(`Duration ${duration}ms is below minimum ${config.limits.minDuration}ms`);
      }
      if (duration > config.limits.maxDuration) {
        warnings.push(`Duration ${duration}ms exceeds maximum ${config.limits.maxDuration}ms`);
      }
    }
  }

  // Validate scenes
  if (!data.scenes || !Array.isArray(data.scenes)) {
    errors.push('Missing or invalid scenes array');
  } else {
    const sceneCount = data.scenes.length;

    // Check scene count
    if (sceneCount < config.limits.minScenes) {
      errors.push(
        `Too few scenes: ${sceneCount} (minimum ${config.limits.minScenes})`
      );
    }
    if (sceneCount > config.limits.maxScenes) {
      errors.push(
        `Too many scenes: ${sceneCount} (maximum ${config.limits.maxScenes})`
      );
    }

    // Check first scene is HOOK
    if (data.scenes.length > 0 && data.scenes[0].scene_type !== 'HOOK') {
      errors.push('First scene must be type HOOK');
    }

    // Check last scene is CTA
    if (data.scenes.length > 0 && data.scenes[data.scenes.length - 1].scene_type !== 'CTA') {
      errors.push('Last scene must be type CTA');
    }

    // Validate each scene
    data.scenes.forEach((scene, index) => {
      const sceneNum = index + 1;

      if (typeof scene.scene_number !== 'number') {
        errors.push(`Scene ${sceneNum}: Missing or invalid scene_number`);
      }
      if (!scene.scene_type) {
        errors.push(`Scene ${sceneNum}: Missing scene_type`);
      }
      if (typeof scene.duration_ms !== 'number') {
        errors.push(`Scene ${sceneNum}: Missing or invalid duration_ms`);
      }

      // Validate visuals
      if (!scene.visuals) {
        errors.push(`Scene ${sceneNum}: Missing visuals object`);
      } else {
        if (!scene.visuals.background) {
          errors.push(`Scene ${sceneNum}: Missing visuals.background`);
        }
        if (!scene.visuals.text_on_screen) {
          warnings.push(`Scene ${sceneNum}: Missing visuals.text_on_screen`);
        }
      }

      // Validate audio
      if (!scene.audio) {
        errors.push(`Scene ${sceneNum}: Missing audio object`);
      } else {
        if (!scene.audio.narration_text) {
          errors.push(`Scene ${sceneNum}: Missing audio.narration_text`);
        }
        if (typeof scene.audio.music_volume !== 'number') {
          warnings.push(`Scene ${sceneNum}: Missing audio.music_volume`);
        }
      }

      // Validate metadata
      if (!scene.metadata) {
        warnings.push(`Scene ${sceneNum}: Missing metadata object`);
      }
    });

    // Validate timeline continuity
    let expectedStartTime = 0;
    data.scenes.forEach((scene, index) => {
      if (scene.start_time_ms !== expectedStartTime) {
        errors.push(
          `Scene ${index + 1}: Timeline gap - expected start ${expectedStartTime}ms, got ${scene.start_time_ms}ms`
        );
      }
      expectedStartTime = scene.end_time_ms;
    });

    // Check total duration matches
    if (data.timeline && data.scenes.length > 0) {
      const lastScene = data.scenes[data.scenes.length - 1];
      if (lastScene.end_time_ms !== data.timeline.total_duration_ms) {
        errors.push(
          `Timeline mismatch: last scene ends at ${lastScene.end_time_ms}ms but total is ${data.timeline.total_duration_ms}ms`
        );
      }
    }
  }

  // Validate assets_needed
  if (!data.assets_needed) {
    warnings.push('Missing assets_needed object');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate that all required assets exist for a script
 * @param {Object} scriptData - Script data
 * @param {string} assetsBasePath - Base path for assets
 * @returns {Promise<Object>} { valid: boolean, errors: Array<string>, missing: Array<string> }
 */
export async function validateAssets(scriptData, assetsBasePath) {
  const errors = [];
  const missing = [];

  if (!scriptData.scenes || !Array.isArray(scriptData.scenes)) {
    errors.push('Invalid script data: missing scenes');
    return { valid: false, errors, missing };
  }

  // Check each scene's assets
  for (const scene of scriptData.scenes) {
    const sceneNum = scene.scene_number;

    // Check audio file
    if (scene.audio && scene.audio.narration_text) {
      const audioPath = `${assetsBasePath}/audio/short_${scriptData.short_id}_scene_${sceneNum}.mp3`;
      if (!await fileExists(audioPath)) {
        missing.push(`Audio: ${audioPath}`);
      }
    }

    // Check image file if needed
    if (scene.visuals && scene.visuals.image_needed) {
      const imagePath = `${assetsBasePath}/images/short_${scriptData.short_id}_scene_${sceneNum}.jpg`;
      if (!await fileExists(imagePath)) {
        missing.push(`Image: ${imagePath}`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    errors,
    missing
  };
}

/**
 * Validate video output file
 * @param {string} videoPath - Path to video file
 * @param {number} minSizeBytes - Minimum expected file size
 * @returns {Promise<Object>} { valid: boolean, errors: Array<string> }
 */
export async function validateVideo(videoPath, minSizeBytes = 100000) {
  const errors = [];

  if (!await fileExists(videoPath)) {
    errors.push(`Video file not found: ${videoPath}`);
    return { valid: false, errors };
  }

  // Check file size
  const stats = await fs.stat(videoPath);

  if (stats.size < minSizeBytes) {
    errors.push(
      `Video file too small (${stats.size} bytes) - likely corrupted or failed render`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format validation results for display
 * @param {Object} result - Validation result
 * @returns {string} Formatted message
 */
export function formatValidationResult(result) {
  let output = '';

  if (result.valid) {
    output += '✅ Validation passed\n';
  } else {
    output += '❌ Validation failed\n';
  }

  if (result.errors && result.errors.length > 0) {
    output += '\nErrors:\n';
    result.errors.forEach(error => {
      output += `  ❌ ${error}\n`;
    });
  }

  if (result.warnings && result.warnings.length > 0) {
    output += '\nWarnings:\n';
    result.warnings.forEach(warning => {
      output += `  ⚠️  ${warning}\n`;
    });
  }

  if (result.missing && result.missing.length > 0) {
    output += '\nMissing assets:\n';
    result.missing.forEach(asset => {
      output += `  📁 ${asset}\n`;
    });
  }

  return output;
}

export default {
  validateMasterAnalysis,
  validateScript,
  validateAssets,
  validateVideo,
  formatValidationResult
};
