import fs from 'fs-extra';
import path from 'path';
import pdf from 'pdf-parse';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read and extract text from a PDF file
 * @param {string} filepath - Path to PDF file
 * @returns {Promise<Object>} Extracted PDF data
 */
export async function readPDF(filepath) {
  try {
    const dataBuffer = await fs.readFile(filepath);
    const data = await pdf(dataBuffer);

    return {
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version
    };
  } catch (error) {
    throw new Error(`Failed to read PDF: ${error.message}`);
  }
}

/**
 * Save data as formatted JSON
 * @param {Object} data - Data to save
 * @param {string} filepath - Destination path
 */
export async function saveJSON(data, filepath) {
  try {
    await ensureDir(path.dirname(filepath));
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Saved: ${filepath}`);
  } catch (error) {
    throw new Error(`Failed to save JSON: ${error.message}`);
  }
}

/**
 * Read JSON file
 * @param {string} filepath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
export async function readJSON(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON: ${error.message}`);
  }
}

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path
 */
export async function ensureDir(dirPath) {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    throw new Error(`Failed to create directory: ${error.message}`);
  }
}

/**
 * Copy file with error handling
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 */
export async function copyFile(src, dest) {
  try {
    await ensureDir(path.dirname(dest));
    await fs.copy(src, dest);
    console.log(`✅ Copied: ${src} → ${dest}`);
  } catch (error) {
    throw new Error(`Failed to copy file: ${error.message}`);
  }
}

/**
 * Get all files in a directory with a specific extension
 * @param {string} dirPath - Directory path
 * @param {string} extension - File extension (e.g., '.json')
 * @returns {Promise<Array<string>>} Array of file paths
 */
export async function getFilesWithExtension(dirPath, extension) {
  try {
    const files = await fs.readdir(dirPath);
    return files
      .filter(file => path.extname(file) === extension)
      .map(file => path.join(dirPath, file));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new Error(`Failed to read directory: ${error.message}`);
  }
}

/**
 * Check if file exists
 * @param {string} filepath - File path
 * @returns {Promise<boolean>}
 */
export async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * @param {string} filepath - File path
 * @returns {Promise<number>} File size in bytes
 */
export async function getFileSize(filepath) {
  try {
    const stats = await fs.stat(filepath);
    return stats.size;
  } catch (error) {
    throw new Error(`Failed to get file size: ${error.message}`);
  }
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Delete file if it exists
 * @param {string} filepath - File path
 */
export async function deleteFile(filepath) {
  try {
    if (await fileExists(filepath)) {
      await fs.unlink(filepath);
      console.log(`🗑️  Deleted: ${filepath}`);
    }
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Clean filename for safe file system usage
 * @param {string} filename - Original filename
 * @returns {string} Cleaned filename
 */
export function cleanFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Generate unique filename
 * @param {string} basePath - Base directory path
 * @param {string} baseName - Base filename
 * @param {string} extension - File extension
 * @returns {Promise<string>} Unique filepath
 */
export async function generateUniqueFilename(basePath, baseName, extension) {
  let counter = 1;
  let filepath = path.join(basePath, `${baseName}${extension}`);

  while (await fileExists(filepath)) {
    filepath = path.join(basePath, `${baseName}_${counter}${extension}`);
    counter++;
  }

  return filepath;
}

export default {
  readPDF,
  saveJSON,
  readJSON,
  ensureDir,
  copyFile,
  getFilesWithExtension,
  fileExists,
  getFileSize,
  formatBytes,
  deleteFile,
  cleanFilename,
  generateUniqueFilename
};
