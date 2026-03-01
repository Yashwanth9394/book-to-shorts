#!/usr/bin/env node

import path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import ClaudeAPI from '../src/utils/claude-api.js';
import { readPDF, saveJSON, getFilesWithExtension, formatBytes } from '../src/utils/file-utils.js';
import { validateMasterAnalysis, formatValidationResult } from '../src/utils/validators.js';
import { validateConfig } from '../src/config/config.js';
import config from '../src/config/config.js';
import fs from 'fs-extra';

/**
 * Main function to analyze a book and generate master analysis
 */
async function analyzeBook() {
  console.log(chalk.bold.blue('\n📚 BOOK TO VIRAL SHORTS - STEP 1: BOOK ANALYSIS\n'));

  try {
    // Validate configuration
    console.log('🔍 Validating configuration...');
    validateConfig();
    console.log(chalk.green('✅ Configuration valid\n'));

    // Find PDF files
    console.log('📁 Looking for PDF books in data/books/...');
    const bookFiles = await getFilesWithExtension(config.paths.books, '.pdf');

    if (bookFiles.length === 0) {
      console.log(chalk.red('❌ No PDF files found in data/books/'));
      console.log(chalk.yellow('\nPlease add a PDF book to the data/books/ directory and try again.'));
      process.exit(1);
    }

    console.log(chalk.green(`✅ Found ${bookFiles.length} book(s):\n`));
    bookFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${path.basename(file)}`);
    });

    // Process first book (can be extended to handle multiple)
    const bookPath = bookFiles[0];
    const bookName = path.basename(bookPath, '.pdf');
    console.log(chalk.cyan(`\n📖 Processing: ${bookName}\n`));

    // Read PDF
    console.log('📄 Extracting text from PDF...');
    const progressBar = new cliProgress.SingleBar({
      format: '  Progress |' + chalk.cyan('{bar}') + '| {percentage}% | {stage}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(100, 0, { stage: 'Reading PDF' });

    const pdfData = await readPDF(bookPath);
    progressBar.update(30, { stage: 'Extracting text' });

    const textLength = pdfData.text.length;
    const fileSize = await fs.stat(bookPath).then(s => s.size);

    progressBar.update(40, { stage: 'Text extracted' });
    progressBar.stop();

    console.log(chalk.green('✅ PDF extracted successfully'));
    console.log(`   Pages: ${pdfData.pages}`);
    console.log(`   Text length: ${textLength.toLocaleString()} characters`);
    console.log(`   File size: ${formatBytes(fileSize)}\n`);

    // Check if text is too long (Claude has limits)
    const maxChars = 180000; // Safe limit for Claude
    let bookText = pdfData.text;

    if (textLength > maxChars) {
      console.log(chalk.yellow(`⚠️  Text is too long (${textLength} chars). Truncating to ${maxChars} chars...`));
      bookText = bookText.substring(0, maxChars);
    }

    // Load prompt template
    console.log('📝 Loading analysis prompt...');
    const promptPath = './src/prompts/master-analysis.txt';
    const prompt = await fs.readFile(promptPath, 'utf-8');
    console.log(chalk.green('✅ Prompt loaded\n'));

    // Send to Claude for analysis
    console.log('🤖 Sending to Claude for analysis...');
    console.log(chalk.dim('   This may take 30-60 seconds...\n'));

    const claudeAPI = new ClaudeAPI();
    const analysis = await claudeAPI.analyzeBook(prompt, bookText);

    console.log(chalk.green('✅ Analysis received from Claude\n'));

    // Validate the analysis
    console.log('🔍 Validating analysis structure...');
    const validation = validateMasterAnalysis(analysis);

    console.log(formatValidationResult(validation));

    if (!validation.valid) {
      console.log(chalk.red('❌ Analysis validation failed. Please check the errors above.'));
      process.exit(1);
    }

    // Save the analysis
    const outputPath = path.join(config.paths.masterAnalysis, `${bookName}.json`);
    await saveJSON(analysis, outputPath);

    // Display summary
    console.log(chalk.bold.green('\n✅ ANALYSIS COMPLETE!\n'));
    console.log(chalk.bold('📊 SUMMARY:\n'));
    console.log(`   Book: ${analysis.book_info.title}`);
    console.log(`   Author: ${analysis.book_info.author}`);
    console.log(`   Pages: ${analysis.book_info.total_pages}`);
    console.log(`   Stories identified: ${analysis.viral_stories.length}`);

    // Show top 5 stories by viral score
    console.log(chalk.bold('\n🔥 TOP 5 VIRAL STORIES:\n'));
    const topStories = [...analysis.viral_stories]
      .sort((a, b) => b.viral_potential.total_score - a.viral_potential.total_score)
      .slice(0, 5);

    topStories.forEach((story, index) => {
      console.log(`   ${index + 1}. ${story.title}`);
      console.log(`      Score: ${story.viral_potential.total_score}/10`);
      console.log(`      ${chalk.dim(story.plot_summary.substring(0, 100))}...`);
      console.log();
    });

    // Show style guide
    console.log(chalk.bold('🎨 STYLE GUIDE:\n'));
    console.log(`   Tone: ${analysis.style_guide.tone}`);
    console.log(`   Pacing: ${analysis.style_guide.pacing}`);
    console.log(`   Voice: ${analysis.style_guide.narration_voice}`);

    // Show next steps
    console.log(chalk.bold.cyan('\n📋 NEXT STEPS:\n'));
    console.log('   1. Review the analysis in:', chalk.yellow(outputPath));
    console.log('   2. Run: ' + chalk.yellow('npm run create-scripts') + ' to generate video scripts');
    console.log('   3. Or run: ' + chalk.yellow('npm run full-pipeline') + ' to complete everything\n');

    // Show API usage
    const stats = claudeAPI.getStats();
    console.log(chalk.dim(`   API Requests made: ${stats.requestCount}`));
    console.log(chalk.dim(`   Model used: ${stats.model}\n`));

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
  analyzeBook();
}

export default analyzeBook;
