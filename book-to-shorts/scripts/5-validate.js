#!/usr/bin/env node

import path from 'path';
import chalk from 'chalk';
import { readJSON, getFilesWithExtension, fileExists, getFileSize, formatBytes } from '../src/utils/file-utils.js';
import { validateScript, validateAssets, validateVideo } from '../src/utils/validators.js';
import config from '../src/config/config.js';

/**
 * Main validation function
 */
async function validate() {
  console.log(chalk.bold.blue('\n✓ BOOK TO VIRAL SHORTS - VALIDATION REPORT\n'));

  const report = {
    scripts: {
      total: 0,
      valid: 0,
      invalid: 0,
      warnings: 0,
      issues: []
    },
    assets: {
      audio: {
        expected: 0,
        found: 0,
        missing: []
      },
      images: {
        expected: 0,
        found: 0,
        missing: []
      }
    },
    videos: {
      total: 0,
      valid: 0,
      invalid: 0,
      totalSize: 0,
      issues: []
    }
  };

  try {
    // 1. VALIDATE SCRIPTS
    console.log(chalk.bold('📝 VALIDATING SCRIPTS\n'));

    const scriptFiles = await getFilesWithExtension(config.paths.scripts, '.json');
    const scripts = scriptFiles.filter(f => !path.basename(f).startsWith('_'));

    report.scripts.total = scripts.length;

    if (scripts.length === 0) {
      console.log(chalk.red('❌ No scripts found'));
    } else {
      for (const scriptPath of scripts) {
        const script = await readJSON(scriptPath);
        const validation = validateScript(script);

        if (validation.valid) {
          report.scripts.valid++;
        } else {
          report.scripts.invalid++;
          report.scripts.issues.push({
            shortId: script.short_id,
            title: script.title,
            errors: validation.errors
          });
        }

        if (validation.warnings && validation.warnings.length > 0) {
          report.scripts.warnings += validation.warnings.length;
        }

        // Count expected assets
        for (const scene of script.scenes) {
          if (scene.audio && scene.audio.narration_text) {
            report.assets.audio.expected++;
          }
          if (scene.visuals && scene.visuals.image_needed) {
            report.assets.images.expected++;
          }
        }
      }

      if (report.scripts.valid === report.scripts.total) {
        console.log(chalk.green(`✅ All ${report.scripts.total} scripts valid`));
      } else {
        console.log(chalk.red(`❌ ${report.scripts.invalid}/${report.scripts.total} scripts invalid`));
      }

      if (report.scripts.warnings > 0) {
        console.log(chalk.yellow(`⚠️  ${report.scripts.warnings} warnings found`));
      }
    }

    // 2. VALIDATE ASSETS
    console.log(chalk.bold('\n🎨 VALIDATING ASSETS\n'));

    // Check audio files
    console.log('🔊 Audio files:');
    for (const scriptPath of scripts) {
      const script = await readJSON(scriptPath);
      const shortId = script.short_id;

      for (const scene of script.scenes) {
        if (scene.audio && scene.audio.narration_text) {
          const audioFilename = `short_${String(shortId).padStart(3, '0')}_scene_${scene.scene_number}.mp3`;
          const audioPath = path.join(config.paths.audio, audioFilename);

          if (await fileExists(audioPath)) {
            report.assets.audio.found++;
          } else {
            report.assets.audio.missing.push(audioFilename);
          }
        }
      }
    }

    if (report.assets.audio.expected === 0) {
      console.log(chalk.dim('   No audio files expected'));
    } else if (report.assets.audio.found === report.assets.audio.expected) {
      console.log(chalk.green(`   ✅ All ${report.assets.audio.expected} audio files present`));
    } else {
      console.log(chalk.red(`   ❌ ${report.assets.audio.missing.length} audio files missing`));
      console.log(chalk.red(`   Found: ${report.assets.audio.found}/${report.assets.audio.expected}`));
    }

    // Check image files
    console.log('\n🖼️  Image files:');
    for (const scriptPath of scripts) {
      const script = await readJSON(scriptPath);
      const shortId = script.short_id;

      for (const scene of script.scenes) {
        if (scene.visuals && scene.visuals.image_needed) {
          const imageFilename = `short_${String(shortId).padStart(3, '0')}_scene_${scene.scene_number}.jpg`;
          const imagePath = path.join(config.paths.images, imageFilename);

          if (await fileExists(imagePath)) {
            report.assets.images.found++;
          } else {
            report.assets.images.missing.push(imageFilename);
          }
        }
      }
    }

    if (report.assets.images.expected === 0) {
      console.log(chalk.dim('   No image files expected'));
    } else if (report.assets.images.found === report.assets.images.expected) {
      console.log(chalk.green(`   ✅ All ${report.assets.images.expected} image files present`));
    } else {
      console.log(chalk.red(`   ❌ ${report.assets.images.missing.length} image files missing`));
      console.log(chalk.red(`   Found: ${report.assets.images.found}/${report.assets.images.expected}`));
    }

    // 3. VALIDATE VIDEOS
    console.log(chalk.bold('\n🎬 VALIDATING VIDEOS\n'));

    for (const scriptPath of scripts) {
      const script = await readJSON(scriptPath);
      const shortId = script.short_id;

      const videoFilename = `short_${String(shortId).padStart(3, '0')}.mp4`;
      const videoPath = path.join(config.paths.output, videoFilename);

      if (await fileExists(videoPath)) {
        report.videos.total++;

        const validation = await validateVideo(videoPath);

        if (validation.valid) {
          report.videos.valid++;
          const size = await getFileSize(videoPath);
          report.videos.totalSize += size;
        } else {
          report.videos.invalid++;
          report.videos.issues.push({
            shortId,
            title: script.title,
            errors: validation.errors
          });
        }
      }
    }

    if (report.videos.total === 0) {
      console.log(chalk.red('❌ No videos found'));
    } else {
      if (report.videos.valid === report.videos.total) {
        console.log(chalk.green(`✅ All ${report.videos.total} videos rendered and valid`));
      } else {
        console.log(chalk.red(`❌ ${report.videos.invalid}/${report.videos.total} videos invalid`));
      }

      console.log(`   Total size: ${formatBytes(report.videos.totalSize)}`);
      console.log(`   Average size: ${formatBytes(report.videos.totalSize / report.videos.total)}`);
    }

    // 4. FINAL SUMMARY
    console.log(chalk.bold.blue('\n═══════════════════════════════════════'));
    console.log(chalk.bold.blue('📊 VALIDATION SUMMARY'));
    console.log(chalk.bold.blue('═══════════════════════════════════════\n'));

    let allValid = true;

    // Scripts
    if (report.scripts.total > 0 && report.scripts.valid === report.scripts.total) {
      console.log(chalk.green('✅ Scripts: PASS'));
      console.log(chalk.dim(`   ${report.scripts.total} scripts validated`));
    } else {
      console.log(chalk.red('❌ Scripts: FAIL'));
      console.log(chalk.red(`   ${report.scripts.invalid} invalid, ${report.scripts.warnings} warnings`));
      allValid = false;
    }

    // Audio assets
    if (report.assets.audio.expected > 0 && report.assets.audio.found === report.assets.audio.expected) {
      console.log(chalk.green('\n✅ Audio Assets: PASS'));
      console.log(chalk.dim(`   ${report.assets.audio.found} audio files present`));
    } else if (report.assets.audio.expected > 0) {
      console.log(chalk.red('\n❌ Audio Assets: FAIL'));
      console.log(chalk.red(`   ${report.assets.audio.missing.length} files missing`));
      allValid = false;
    } else {
      console.log(chalk.dim('\n⊘  Audio Assets: None expected'));
    }

    // Image assets
    if (report.assets.images.expected > 0 && report.assets.images.found === report.assets.images.expected) {
      console.log(chalk.green('\n✅ Image Assets: PASS'));
      console.log(chalk.dim(`   ${report.assets.images.found} image files present`));
    } else if (report.assets.images.expected > 0) {
      console.log(chalk.red('\n❌ Image Assets: FAIL'));
      console.log(chalk.red(`   ${report.assets.images.missing.length} files missing`));
      allValid = false;
    } else {
      console.log(chalk.dim('\n⊘  Image Assets: None expected'));
    }

    // Videos
    if (report.videos.total > 0 && report.videos.valid === report.videos.total) {
      console.log(chalk.green('\n✅ Videos: PASS'));
      console.log(chalk.dim(`   ${report.videos.total} videos rendered`));
    } else if (report.videos.total > 0) {
      console.log(chalk.red('\n❌ Videos: FAIL'));
      console.log(chalk.red(`   ${report.videos.invalid} invalid videos`));
      allValid = false;
    } else {
      console.log(chalk.red('\n❌ Videos: FAIL'));
      console.log(chalk.red('   No videos found'));
      allValid = false;
    }

    console.log(chalk.bold.blue('\n═══════════════════════════════════════\n'));

    if (allValid) {
      console.log(chalk.bold.green('🎉 VALIDATION PASSED! ALL SYSTEMS GO!\n'));
      console.log(chalk.cyan('Your viral shorts are ready to upload! 🚀\n'));
    } else {
      console.log(chalk.bold.red('⚠️  VALIDATION FAILED\n'));
      console.log(chalk.yellow('Please fix the issues above before proceeding.\n'));
    }

    // 5. DETAILED ISSUES
    if (report.scripts.issues.length > 0) {
      console.log(chalk.bold.red('📋 SCRIPT ISSUES:\n'));
      report.scripts.issues.forEach(issue => {
        console.log(chalk.yellow(`   Short ${issue.shortId}: ${issue.title}`));
        issue.errors.forEach(error => {
          console.log(chalk.red(`      - ${error}`));
        });
      });
      console.log();
    }

    if (report.assets.audio.missing.length > 0) {
      console.log(chalk.bold.red('🔊 MISSING AUDIO FILES:\n'));
      report.assets.audio.missing.slice(0, 10).forEach(file => {
        console.log(chalk.red(`   - ${file}`));
      });
      if (report.assets.audio.missing.length > 10) {
        console.log(chalk.dim(`   ... and ${report.assets.audio.missing.length - 10} more`));
      }
      console.log(chalk.yellow('\n💡 Run: npm run generate-assets\n'));
    }

    if (report.assets.images.missing.length > 0) {
      console.log(chalk.bold.red('🖼️  MISSING IMAGE FILES:\n'));
      report.assets.images.missing.slice(0, 10).forEach(file => {
        console.log(chalk.red(`   - ${file}`));
      });
      if (report.assets.images.missing.length > 10) {
        console.log(chalk.dim(`   ... and ${report.assets.images.missing.length - 10} more`));
      }
      console.log(chalk.yellow('\n💡 Run: npm run generate-assets\n'));
    }

    if (report.videos.issues.length > 0) {
      console.log(chalk.bold.red('🎬 VIDEO ISSUES:\n'));
      report.videos.issues.forEach(issue => {
        console.log(chalk.yellow(`   Short ${issue.shortId}: ${issue.title}`));
        issue.errors.forEach(error => {
          console.log(chalk.red(`      - ${error}`));
        });
      });
      console.log(chalk.yellow('\n💡 Run: npm run render\n'));
    }

    // Exit with appropriate code
    process.exit(allValid ? 0 : 1);

  } catch (error) {
    console.error(chalk.red('\n❌ VALIDATION ERROR:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validate();
}

export default validate;
