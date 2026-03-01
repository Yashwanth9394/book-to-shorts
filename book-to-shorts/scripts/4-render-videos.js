#!/usr/bin/env node

import path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readJSON, getFilesWithExtension, fileExists, formatBytes } from '../src/utils/file-utils.js';
import { validateVideo } from '../src/utils/validators.js';
import config from '../src/config/config.js';
import fs from 'fs-extra';

const execAsync = promisify(exec);

/**
 * Render a single video using Remotion
 */
async function renderVideo(scriptPath, outputPath) {
  const tempPropsFile = path.join(process.cwd(), '.temp-props.json');

  try {
    // Read script data
    const scriptData = await readJSON(scriptPath);

    // Write props to temp file
    await fs.writeJSON(tempPropsFile, { scriptData }, { spaces: 2 });

    // Build Remotion command
    const command = [
      'npx remotion render',
      'src/video/Root.jsx',
      'viral-short',
      `"${outputPath}"`,
      `--props="${tempPropsFile}"`,
      '--codec=h264',
      '--audio-codec=aac',
      `--crf=${config.video.quality}`,
      '--overwrite'
    ].join(' ');

    // Execute Remotion render
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      cwd: process.cwd()
    });

    // Clean up temp file
    await fs.remove(tempPropsFile);

    return {
      success: true,
      stdout,
      stderr
    };

  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.remove(tempPropsFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    return {
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

/**
 * Main function to render all videos
 */
async function renderVideos() {
  console.log(chalk.bold.blue('\n🎬 BOOK TO VIRAL SHORTS - STEP 4: RENDER VIDEOS\n'));

  try {
    // Find script files
    console.log('📁 Looking for script files...');
    const scriptFiles = await getFilesWithExtension(config.paths.scripts, '.json');

    // Filter out summary files
    const scripts = scriptFiles.filter(f => !path.basename(f).startsWith('_'));

    if (scripts.length === 0) {
      console.log(chalk.red('❌ No script files found in data/scripts/'));
      console.log(chalk.yellow('\nPlease run "npm run create-scripts" first to generate scripts.\n'));
      process.exit(1);
    }

    console.log(chalk.green(`✅ Found ${scripts.length} script(s)\n`));

    // Ensure output directory exists
    await fs.ensureDir(config.paths.output);

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: '  Progress |' + chalk.cyan('{bar}') + '| {value}/{total} | {stage}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(scripts.length, 0, { stage: 'Initializing...' });

    // Process each script
    for (let i = 0; i < scripts.length; i++) {
      const scriptPath = scripts[i];
      const scriptData = await readJSON(scriptPath);
      const shortId = scriptData.short_id;
      const title = scriptData.title;

      const outputFilename = `short_${String(shortId).padStart(3, '0')}.mp4`;
      const outputPath = path.join(config.paths.output, outputFilename);

      // Check if already rendered
      if (await fileExists(outputPath)) {
        // Validate existing video
        const validation = await validateVideo(outputPath);

        if (validation.valid) {
          const fileSize = await fs.stat(outputPath).then(s => s.size);
          results.skipped.push({
            shortId,
            title,
            path: outputPath,
            size: fileSize
          });
          progressBar.update(i + 1, {
            stage: `✅ Skipped: ${title.substring(0, 30)} (already exists)`
          });
          continue;
        } else {
          console.log(chalk.yellow(`\n⚠️  Existing video is invalid, re-rendering...`));
        }
      }

      progressBar.update(i, {
        stage: `Rendering: ${title.substring(0, 30)}...`
      });

      // Render video
      const result = await renderVideo(scriptPath, outputPath);

      if (result.success) {
        // Validate rendered video
        const validation = await validateVideo(outputPath);

        if (validation.valid) {
          const fileSize = await fs.stat(outputPath).then(s => s.size);
          results.success.push({
            shortId,
            title,
            path: outputPath,
            size: fileSize
          });
          progressBar.update(i + 1, {
            stage: `✅ Rendered: ${title.substring(0, 30)}`
          });
        } else {
          results.failed.push({
            shortId,
            title,
            error: validation.errors.join(', ')
          });
          progressBar.update(i + 1, {
            stage: `❌ Failed validation: ${title.substring(0, 30)}`
          });
        }
      } else {
        results.failed.push({
          shortId,
          title,
          error: result.error
        });
        progressBar.update(i + 1, {
          stage: `❌ Failed: ${title.substring(0, 30)}`
        });
      }
    }

    progressBar.stop();

    // Display results
    console.log(chalk.bold.green('\n✅ VIDEO RENDERING COMPLETE!\n'));

    console.log(chalk.bold('📊 SUMMARY:\n'));
    console.log(`   ${chalk.green('✅ Rendered:')} ${results.success.length}`);
    console.log(`   ${chalk.yellow('⏩ Skipped (already existed):')} ${results.skipped.length}`);
    console.log(`   ${chalk.red('❌ Failed:')} ${results.failed.length}`);

    // Calculate total file size
    const allVideos = [...results.success, ...results.skipped];
    if (allVideos.length > 0) {
      const totalSize = allVideos.reduce((sum, v) => sum + v.size, 0);
      const avgSize = totalSize / allVideos.length;

      console.log(chalk.bold('\n📈 STATISTICS:\n'));
      console.log(`   Total videos: ${allVideos.length}`);
      console.log(`   Total size: ${formatBytes(totalSize)}`);
      console.log(`   Average size: ${formatBytes(avgSize)}`);
    }

    // Show successful renders
    if (results.success.length > 0) {
      console.log(chalk.bold('\n✅ NEWLY RENDERED:\n'));
      results.success.slice(0, 5).forEach(video => {
        console.log(`   ${video.shortId}. ${video.title}`);
        console.log(`      ${formatBytes(video.size)} - ${path.basename(video.path)}`);
      });
      if (results.success.length > 5) {
        console.log(chalk.dim(`   ... and ${results.success.length - 5} more`));
      }
    }

    // Show failures
    if (results.failed.length > 0) {
      console.log(chalk.bold.red('\n❌ FAILED RENDERS:\n'));
      results.failed.forEach(failure => {
        console.log(`   ${failure.shortId}. ${failure.title}`);
        console.log(chalk.red(`      Error: ${failure.error}`));
      });

      console.log(chalk.yellow('\n💡 TIP: Check that all assets were generated in Step 3.'));
      console.log(chalk.yellow('   Run: npm run validate to see what\'s missing.\n'));
    }

    // Show next steps
    console.log(chalk.bold.cyan('\n📋 NEXT STEPS:\n'));
    console.log('   1. Review videos in:', chalk.yellow(config.paths.output));
    console.log('   2. Run: ' + chalk.yellow('npm run validate') + ' to verify everything');
    console.log('   3. Upload to TikTok/Instagram and watch them go viral! 🚀\n');

    // Exit with error if there were failures
    if (results.failed.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ ERROR:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  renderVideos();
}

export default renderVideos;
