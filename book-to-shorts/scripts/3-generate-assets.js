#!/usr/bin/env node

import path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { ElevenLabsClient } from 'elevenlabs';
import fetch from 'node-fetch';
import { readJSON, getFilesWithExtension, fileExists, ensureDir } from '../src/utils/file-utils.js';
import { validateConfig } from '../src/config/config.js';
import config from '../src/config/config.js';
import PipelineValidator from '../src/utils/pipeline-validator.js';
import fs from 'fs-extra';

/**
 * Generate audio using ElevenLabs API
 */
async function generateAudio(text, outputPath, voiceId, apiKey) {
  try {
    const client = new ElevenLabsClient({ apiKey });

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text,
      model_id: config.apis.elevenlabs.modelId,
      voice_settings: {
        stability: config.apis.elevenlabs.stability,
        similarity_boost: config.apis.elevenlabs.similarityBoost,
        style: config.apis.elevenlabs.style,
        use_speaker_boost: config.apis.elevenlabs.useSpeakerBoost
      }
    });

    // Ensure directory exists
    await ensureDir(path.dirname(outputPath));

    // Write audio stream to file
    const writer = fs.createWriteStream(outputPath);

    for await (const chunk of audioStream) {
      writer.write(chunk);
    }

    writer.end();

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

  } catch (error) {
    throw new Error(`ElevenLabs API error: ${error.message}`);
  }
}

/**
 * Fetch image from Unsplash
 */
async function fetchImage(query, outputPath, accessKey) {
  try {
    // Search for image
    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Unsplash API error: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.results.length === 0) {
      throw new Error(`No images found for query: ${query}`);
    }

    // Get the image URL
    const imageUrl = searchData.results[0].urls.regular;

    // Download the image
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    // Ensure directory exists
    await ensureDir(path.dirname(outputPath));

    // Save image
    const buffer = await imageResponse.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));

  } catch (error) {
    throw new Error(`Image fetch error: ${error.message}`);
  }
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to generate all assets
 */
async function generateAssets() {
  console.log(chalk.bold.blue('\n🎨 BOOK TO VIRAL SHORTS - STEP 3: GENERATE ASSETS\n'));

  try {
    // Validate pipeline
    const validator = new PipelineValidator();
    validator.validate('generate-assets');

    // Validate configuration
    console.log('🔍 Validating configuration...');
    validateConfig();
    console.log(chalk.green('✅ Configuration valid\n'));

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

    // Initialize APIs
    const elevenLabsApiKey = config.apis.elevenlabs.apiKey;
    const unsplashApiKey = config.apis.unsplash.accessKey;
    const voiceId = config.apis.elevenlabs.voiceId;

    const results = {
      audioGenerated: 0,
      audioFailed: 0,
      imagesGenerated: 0,
      imagesFailed: 0,
      errors: []
    };

    // Count total assets needed
    let totalAssets = 0;
    const scriptData = [];

    for (const scriptFile of scripts) {
      const script = await readJSON(scriptFile);
      scriptData.push({ file: scriptFile, data: script });

      for (const scene of script.scenes) {
        if (scene.audio && scene.audio.narration_text) {
          totalAssets++; // Audio
        }
        if (scene.visuals && scene.visuals.image_needed) {
          totalAssets++; // Image
        }
      }
    }

    console.log(`📊 Total assets to generate: ${totalAssets}\n`);

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: '  Progress |' + chalk.cyan('{bar}') + '| {value}/{total} | {stage}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(totalAssets, 0, { stage: 'Initializing...' });

    let assetsProcessed = 0;

    // Process each script
    for (const { file, data: script } of scriptData) {
      const shortId = script.short_id;

      // Process each scene
      for (const scene of script.scenes) {
        const sceneNum = scene.scene_number;

        // Generate audio
        if (scene.audio && scene.audio.narration_text) {
          const audioFilename = `short_${String(shortId).padStart(3, '0')}_scene_${sceneNum}.mp3`;
          const audioPath = path.join(config.paths.audio, audioFilename);

          // Skip if already exists
          if (await fileExists(audioPath)) {
            progressBar.update(++assetsProcessed, {
              stage: `Audio exists: Short ${shortId} Scene ${sceneNum}`
            });
            results.audioGenerated++;
            continue;
          }

          try {
            progressBar.update(assetsProcessed, {
              stage: `Generating audio: Short ${shortId} Scene ${sceneNum}`
            });

            await generateAudio(
              scene.audio.narration_text,
              audioPath,
              voiceId,
              elevenLabsApiKey
            );

            results.audioGenerated++;
            progressBar.update(++assetsProcessed, {
              stage: `✅ Audio: Short ${shortId} Scene ${sceneNum}`
            });

            // Rate limiting for ElevenLabs
            await sleep(config.rateLimits.elevenlabs.delayBetweenRequests);

          } catch (error) {
            results.audioFailed++;
            results.errors.push({
              type: 'audio',
              shortId,
              sceneNum,
              error: error.message
            });
            progressBar.update(++assetsProcessed, {
              stage: `❌ Audio failed: Short ${shortId} Scene ${sceneNum}`
            });
          }
        }

        // Generate image
        if (scene.visuals && scene.visuals.image_needed && scene.visuals.image_prompt) {
          const imageFilename = `short_${String(shortId).padStart(3, '0')}_scene_${sceneNum}.jpg`;
          const imagePath = path.join(config.paths.images, imageFilename);

          // Skip if already exists
          if (await fileExists(imagePath)) {
            progressBar.update(++assetsProcessed, {
              stage: `Image exists: Short ${shortId} Scene ${sceneNum}`
            });
            results.imagesGenerated++;
            continue;
          }

          try {
            progressBar.update(assetsProcessed, {
              stage: `Fetching image: Short ${shortId} Scene ${sceneNum}`
            });

            await fetchImage(
              scene.visuals.image_prompt,
              imagePath,
              unsplashApiKey
            );

            results.imagesGenerated++;
            progressBar.update(++assetsProcessed, {
              stage: `✅ Image: Short ${shortId} Scene ${sceneNum}`
            });

            // Rate limiting for Unsplash
            await sleep(config.rateLimits.unsplash.delayBetweenRequests);

          } catch (error) {
            results.imagesFailed++;
            results.errors.push({
              type: 'image',
              shortId,
              sceneNum,
              error: error.message
            });
            progressBar.update(++assetsProcessed, {
              stage: `❌ Image failed: Short ${shortId} Scene ${sceneNum}`
            });
          }
        }
      }
    }

    progressBar.stop();

    // Display results
    console.log(chalk.bold.green('\n✅ ASSET GENERATION COMPLETE!\n'));

    console.log(chalk.bold('📊 SUMMARY:\n'));
    console.log(`   ${chalk.green('🔊 Audio generated:')} ${results.audioGenerated}`);
    console.log(`   ${chalk.red('🔊 Audio failed:')} ${results.audioFailed}`);
    console.log(`   ${chalk.green('🖼️  Images generated:')} ${results.imagesGenerated}`);
    console.log(`   ${chalk.red('🖼️  Images failed:')} ${results.imagesFailed}`);

    // Show errors if any
    if (results.errors.length > 0) {
      console.log(chalk.bold.red(`\n❌ ERRORS (${results.errors.length}):\n`));

      // Group errors by type
      const audioErrors = results.errors.filter(e => e.type === 'audio');
      const imageErrors = results.errors.filter(e => e.type === 'image');

      if (audioErrors.length > 0) {
        console.log(chalk.yellow('   Audio errors:'));
        audioErrors.slice(0, 5).forEach(e => {
          console.log(`     - Short ${e.shortId} Scene ${e.sceneNum}: ${e.error}`);
        });
        if (audioErrors.length > 5) {
          console.log(chalk.dim(`     ... and ${audioErrors.length - 5} more`));
        }
      }

      if (imageErrors.length > 0) {
        console.log(chalk.yellow('\n   Image errors:'));
        imageErrors.slice(0, 5).forEach(e => {
          console.log(`     - Short ${e.shortId} Scene ${e.sceneNum}: ${e.error}`);
        });
        if (imageErrors.length > 5) {
          console.log(chalk.dim(`     ... and ${imageErrors.length - 5} more`));
        }
      }

      console.log(chalk.yellow('\n💡 TIP: You can re-run this script to retry failed assets.\n'));
    }

    // Show next steps
    console.log(chalk.bold.cyan('\n📋 NEXT STEPS:\n'));
    console.log('   1. Review assets in:', chalk.yellow(config.paths.assets));
    console.log('   2. Run: ' + chalk.yellow('npm run render') + ' to generate videos');
    console.log('   3. Or run: ' + chalk.yellow('npm run validate') + ' to check everything\n');

    // Exit with error if there were critical failures
    if (results.audioFailed > results.audioGenerated * 0.5) {
      console.log(chalk.red('⚠️  Too many audio generation failures. Please check your ElevenLabs API key and quota.\n'));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ ERROR:'), error.message);

    if (error.message.includes('API key')) {
      console.log(chalk.yellow('\n💡 TIP: Make sure you have set up your .env file with API keys.'));
      console.log(chalk.yellow('   Copy .env.example to .env and fill in your keys.\n'));
    }

    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAssets();
}

export default generateAssets;
