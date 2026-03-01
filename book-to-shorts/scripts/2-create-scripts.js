#!/usr/bin/env node

import path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import ClaudeAPI from '../src/utils/claude-api.js';
import { readJSON, saveJSON, getFilesWithExtension } from '../src/utils/file-utils.js';
import { validateScript, formatValidationResult } from '../src/utils/validators.js';
import { validateConfig } from '../src/config/config.js';
import config from '../src/config/config.js';
import fs from 'fs-extra';

/**
 * Format milliseconds to display time
 */
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Main function to create scripts from master analysis
 */
async function createScripts() {
  console.log(chalk.bold.blue('\n📝 BOOK TO VIRAL SHORTS - STEP 2: CREATE SCRIPTS\n'));

  try {
    // Validate configuration
    console.log('🔍 Validating configuration...');
    validateConfig();
    console.log(chalk.green('✅ Configuration valid\n'));

    // Find master analysis files
    console.log('📁 Looking for master analysis files...');
    const analysisFiles = await getFilesWithExtension(config.paths.masterAnalysis, '.json');

    if (analysisFiles.length === 0) {
      console.log(chalk.red('❌ No master analysis files found in data/master-analysis/'));
      console.log(chalk.yellow('\nPlease run "npm run analyze" first to analyze a book.\n'));
      process.exit(1);
    }

    console.log(chalk.green(`✅ Found ${analysisFiles.length} analysis file(s)\n`));

    // Process first analysis (can be extended to handle multiple)
    const analysisPath = analysisFiles[0];
    const analysisName = path.basename(analysisPath, '.json');
    console.log(chalk.cyan(`📖 Processing: ${analysisName}\n`));

    // Load master analysis
    console.log('📄 Loading master analysis...');
    const masterAnalysis = await readJSON(analysisPath);
    console.log(chalk.green('✅ Master analysis loaded'));
    console.log(`   Stories to script: ${masterAnalysis.viral_stories.length}\n`);

    // Load script creation prompt
    console.log('📝 Loading script creation prompt...');
    const promptPath = './src/prompts/script-creation.txt';
    const promptTemplate = await fs.readFile(promptPath, 'utf-8');
    console.log(chalk.green('✅ Prompt template loaded\n'));

    // Initialize Claude API
    const claudeAPI = new ClaudeAPI();

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: '  Progress |' + chalk.cyan('{bar}') + '| {value}/{total} Scripts | Current: {currentStory}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    const stories = masterAnalysis.viral_stories;
    progressBar.start(stories.length, 0, { currentStory: 'Initializing...' });

    const results = {
      success: [],
      failed: [],
      warnings: []
    };

    // Process each story
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const storyNum = i + 1;

      progressBar.update(i, { currentStory: story.title.substring(0, 40) });

      try {
        // Generate script using Claude
        const scriptData = await claudeAPI.createScript(
          promptTemplate,
          masterAnalysis,
          story
        );

        // Add story reference
        scriptData.short_id = story.story_id;
        scriptData.book_reference = {
          book: masterAnalysis.book_info.title,
          author: masterAnalysis.book_info.author,
          chapter: story.chapter,
          pages: story.pages
        };

        // Validate script
        const validation = validateScript(scriptData);

        if (!validation.valid) {
          results.failed.push({
            storyId: story.story_id,
            title: story.title,
            errors: validation.errors
          });
          continue;
        }

        if (validation.warnings && validation.warnings.length > 0) {
          results.warnings.push({
            storyId: story.story_id,
            title: story.title,
            warnings: validation.warnings
          });
        }

        // Save script
        const scriptFilename = `short_${String(story.story_id).padStart(3, '0')}.json`;
        const scriptPath = path.join(config.paths.scripts, scriptFilename);
        await saveJSON(scriptData, scriptPath);

        results.success.push({
          storyId: story.story_id,
          title: story.title,
          duration: scriptData.timeline.total_duration_ms,
          sceneCount: scriptData.scenes.length,
          path: scriptPath
        });

      } catch (error) {
        results.failed.push({
          storyId: story.story_id,
          title: story.title,
          errors: [error.message]
        });
      }

      progressBar.update(storyNum);
    }

    progressBar.stop();

    // Display results
    console.log(chalk.bold.green('\n✅ SCRIPT CREATION COMPLETE!\n'));

    console.log(chalk.bold('📊 SUMMARY:\n'));
    console.log(`   ${chalk.green('✅ Successful:')} ${results.success.length}`);
    console.log(`   ${chalk.red('❌ Failed:')} ${results.failed.length}`);
    console.log(`   ${chalk.yellow('⚠️  Warnings:')} ${results.warnings.length}`);

    // Show successful scripts
    if (results.success.length > 0) {
      console.log(chalk.bold('\n✅ SUCCESSFUL SCRIPTS:\n'));
      results.success.forEach((script, index) => {
        if (index < 5 || index >= results.success.length - 2) {
          console.log(`   ${script.storyId}. ${script.title}`);
          console.log(`      Duration: ${formatTime(script.duration)} | Scenes: ${script.sceneCount}`);
        } else if (index === 5) {
          console.log(chalk.dim(`   ... (${results.success.length - 7} more) ...`));
        }
      });

      // Calculate statistics
      const durations = results.success.map(s => s.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);

      console.log(chalk.bold('\n📈 STATISTICS:\n'));
      console.log(`   Average duration: ${formatTime(avgDuration)}`);
      console.log(`   Shortest: ${formatTime(minDuration)}`);
      console.log(`   Longest: ${formatTime(maxDuration)}`);
    }

    // Show warnings
    if (results.warnings.length > 0) {
      console.log(chalk.bold.yellow('\n⚠️  WARNINGS:\n'));
      results.warnings.forEach(warning => {
        console.log(`   ${warning.storyId}. ${warning.title}`);
        warning.warnings.forEach(w => {
          console.log(chalk.yellow(`      - ${w}`));
        });
      });
    }

    // Show failures
    if (results.failed.length > 0) {
      console.log(chalk.bold.red('\n❌ FAILED SCRIPTS:\n'));
      results.failed.forEach(failure => {
        console.log(`   ${failure.storyId}. ${failure.title}`);
        failure.errors.forEach(error => {
          console.log(chalk.red(`      - ${error}`));
        });
      });
    }

    // Save summary
    const summaryPath = path.join(config.paths.scripts, '_summary.json');
    await saveJSON(results, summaryPath);
    console.log(chalk.dim(`\n   Summary saved to: ${summaryPath}`));

    // Show next steps
    console.log(chalk.bold.cyan('\n📋 NEXT STEPS:\n'));
    console.log('   1. Review scripts in:', chalk.yellow(config.paths.scripts));
    console.log('   2. Run: ' + chalk.yellow('npm run generate-assets') + ' to create audio and images');
    console.log('   3. Or run: ' + chalk.yellow('npm run full-pipeline') + ' to complete everything\n');

    // Show API usage
    const stats = claudeAPI.getStats();
    console.log(chalk.dim(`   API Requests made: ${stats.requestCount}`));
    console.log(chalk.dim(`   Model used: ${stats.model}\n`));

    // Exit with error if there were failures
    if (results.failed.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ ERROR:'), error.message);

    if (error.message.includes('API key')) {
      console.log(chalk.yellow('\n💡 TIP: Make sure you have set up your .env file with API keys.'));
      console.log(chalk.yellow('   Copy .env.example to .env and fill in your keys.\n'));
    }

    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createScripts();
}

export default createScripts;
