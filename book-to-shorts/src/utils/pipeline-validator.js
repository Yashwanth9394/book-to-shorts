import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Pipeline validator - ensures each step has required inputs
 * Prevents running steps out of order
 */
class PipelineValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
  }

  /**
   * Validate step prerequisites
   * @param {string} step - Step name: 'analyze', 'create-scripts', 'generate-assets', 'render'
   * @throws {Error} If prerequisites not met
   */
  validate(step) {
    console.log(`🔍 Validating prerequisites for: ${step}`);

    switch (step) {
      case 'analyze':
        return this.validateBooksExist();

      case 'create-scripts':
        return this.validateAnalysisExists();

      case 'generate-assets':
        return this.validateScriptsExist();

      case 'render':
        return this.validateAssetsExist();

      default:
        throw new Error(`Unknown step: ${step}`);
    }
  }

  /**
   * Validate books exist for analysis
   */
  validateBooksExist() {
    const booksPath = path.join(this.projectRoot, 'data/books');

    if (!fs.existsSync(booksPath)) {
      throw new Error(
        `Books directory not found: ${booksPath}\n` +
        `Please create it and add PDF files.`
      );
    }

    const books = fs.readdirSync(booksPath)
      .filter(f => f.endsWith('.pdf') && !f.startsWith('.'));

    if (books.length === 0) {
      throw new Error(
        `No PDF books found in: ${booksPath}\n\n` +
        `📖 Please add a PDF book to continue.\n` +
        `   Example: cp /path/to/book.pdf data/books/`
      );
    }

    console.log(`✅ Found ${books.length} book(s)`);
    return { valid: true, count: books.length, books };
  }

  /**
   * Validate master analysis exists
   */
  validateAnalysisExists() {
    const analysisPath = path.join(this.projectRoot, 'data/master-analysis');

    if (!fs.existsSync(analysisPath)) {
      throw new Error(
        `Master analysis directory not found.\n\n` +
        `⚠️  You need to run book analysis first:\n` +
        `   npm run analyze`
      );
    }

    const analyses = fs.readdirSync(analysisPath)
      .filter(f => f.endsWith('.json') && !f.startsWith('_'));

    if (analyses.length === 0) {
      throw new Error(
        `No master analysis files found.\n\n` +
        `⚠️  Run book analysis first:\n` +
        `   npm run analyze`
      );
    }

    console.log(`✅ Found ${analyses.length} analysis file(s)`);
    return { valid: true, count: analyses.length };
  }

  /**
   * Validate scripts exist
   */
  validateScriptsExist() {
    const scriptsPath = path.join(this.projectRoot, 'data/scripts');

    if (!fs.existsSync(scriptsPath)) {
      throw new Error(
        `Scripts directory not found.\n\n` +
        `⚠️  You need to create scripts first:\n` +
        `   npm run create-scripts`
      );
    }

    const scripts = fs.readdirSync(scriptsPath)
      .filter(f => f.endsWith('.json') && !f.startsWith('_'));

    if (scripts.length === 0) {
      throw new Error(
        `No script files found.\n\n` +
        `⚠️  Create scripts first:\n` +
        `   npm run create-scripts`
      );
    }

    // Validate script structure
    let validScripts = 0;
    let invalidScripts = [];

    for (const scriptFile of scripts) {
      try {
        const scriptPath = path.join(scriptsPath, scriptFile);
        const script = fs.readJsonSync(scriptPath);

        if (this.isValidScript(script)) {
          validScripts++;
        } else {
          invalidScripts.push(scriptFile);
        }
      } catch (error) {
        invalidScripts.push(`${scriptFile} (parse error)`);
      }
    }

    if (invalidScripts.length > 0) {
      console.warn(`⚠️  ${invalidScripts.length} invalid script(s):`);
      invalidScripts.forEach(s => console.warn(`   - ${s}`));
    }

    console.log(`✅ Found ${validScripts} valid script(s)`);
    return { valid: true, count: validScripts, invalid: invalidScripts };
  }

  /**
   * Validate assets exist
   */
  validateAssetsExist() {
    const issues = [];
    const warnings = [];

    // Check directories
    const assetsPath = path.join(this.projectRoot, 'data/assets');
    const audioPath = path.join(assetsPath, 'audio');
    const imagesPath = path.join(assetsPath, 'images');
    const musicPath = path.join(assetsPath, 'music');

    if (!fs.existsSync(audioPath)) {
      issues.push('Missing audio directory');
    } else {
      const audioFiles = fs.readdirSync(audioPath).filter(f => f.endsWith('.mp3'));
      if (audioFiles.length === 0) {
        warnings.push('No audio files found - videos will have no voiceover');
      } else {
        console.log(`✅ Found ${audioFiles.length} audio file(s)`);
      }
    }

    if (!fs.existsSync(imagesPath)) {
      issues.push('Missing images directory');
    } else {
      const imageFiles = fs.readdirSync(imagesPath).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
      if (imageFiles.length === 0) {
        warnings.push('No image files found - videos will use placeholders');
      } else {
        console.log(`✅ Found ${imageFiles.length} image file(s)`);
      }
    }

    if (!fs.existsSync(musicPath)) {
      warnings.push('No music directory - creating with silent placeholders');
      fs.ensureDirSync(musicPath);
    } else {
      const musicFiles = fs.readdirSync(musicPath).filter(f => f.endsWith('.mp3'));
      if (musicFiles.length === 0) {
        warnings.push('No music files found - videos will have no background music');
      } else {
        console.log(`✅ Found ${musicFiles.length} music file(s)`);
      }
    }

    if (issues.length > 0) {
      throw new Error(
        `Assets validation failed:\n\n` +
        issues.map(i => `❌ ${i}`).join('\n') + '\n\n' +
        `⚠️  Generate assets first:\n` +
        `   npm run generate-assets`
      );
    }

    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      warnings.forEach(w => console.warn(`   - ${w}`));
      console.warn('');
    }

    return { valid: true, warnings };
  }

  /**
   * Check if script JSON is valid
   */
  isValidScript(script) {
    if (!script) return false;
    if (!script.short_id) return false;
    if (!script.title) return false;
    if (!script.scenes || !Array.isArray(script.scenes)) return false;
    if (script.scenes.length === 0) return false;

    // Check each scene has required fields
    for (const scene of script.scenes) {
      if (!scene.scene_number) return false;
      if (!scene.visuals) return false;
      if (!scene.audio) return false;
    }

    return true;
  }

  /**
   * Comprehensive validation report
   */
  getFullReport() {
    const report = {
      timestamp: new Date().toISOString(),
      steps: {}
    };

    try {
      report.steps.books = this.validateBooksExist();
    } catch (error) {
      report.steps.books = { valid: false, error: error.message };
    }

    try {
      report.steps.analysis = this.validateAnalysisExists();
    } catch (error) {
      report.steps.analysis = { valid: false, error: error.message };
    }

    try {
      report.steps.scripts = this.validateScriptsExist();
    } catch (error) {
      report.steps.scripts = { valid: false, error: error.message };
    }

    try {
      report.steps.assets = this.validateAssetsExist();
    } catch (error) {
      report.steps.assets = { valid: false, error: error.message };
    }

    return report;
  }
}

export default PipelineValidator;
