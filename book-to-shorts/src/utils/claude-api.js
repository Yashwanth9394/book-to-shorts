import Anthropic from '@anthropic-ai/sdk';
import config from '../config/config.js';
import fs from 'fs-extra';

class ClaudeAPI {
  constructor(apiKey = config.apis.anthropic.apiKey) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey });
    this.model = config.apis.anthropic.model;
    this.maxTokens = config.apis.anthropic.maxTokens;
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting - wait if needed
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = config.rateLimits.anthropic.delayBetweenRequests;

    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic wrapper
   */
  async withRetry(fn, retries = config.retryPolicy.maxRetries) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry on authentication errors
        if (error.status === 401) {
          throw error;
        }

        // Don't retry on invalid request errors
        if (error.status === 400) {
          throw error;
        }

        // Retry on rate limits and server errors
        if (error.status === 429 || error.status >= 500) {
          const delay = config.retryPolicy.initialDelay * Math.pow(config.retryPolicy.backoffMultiplier, i);
          console.log(`⏳ Rate limited or server error. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          await this.sleep(delay);
          continue;
        }

        // For other errors, retry with backoff
        if (i < retries - 1) {
          const delay = config.retryPolicy.initialDelay * Math.pow(config.retryPolicy.backoffMultiplier, i);
          console.log(`⚠️  Error: ${error.message}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Analyze a book PDF and extract viral stories
   * @param {string} prompt - The analysis prompt
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBook(prompt, pdfText) {
    await this.rateLimit();

    return this.withRetry(async () => {
      console.log('📤 Sending book to Claude for analysis...');

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: config.apis.anthropic.temperature,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n=== BOOK CONTENT ===\n${pdfText}`
          }
        ]
      });

      this.requestCount++;

      const responseText = message.content[0].text;

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        const match = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
          jsonText = match[1];
        }
      } else if (responseText.includes('```')) {
        const match = responseText.match(/```\n([\s\S]*?)\n```/);
        if (match) {
          jsonText = match[1];
        }
      }

      try {
        return JSON.parse(jsonText.trim());
      } catch (error) {
        console.error('Failed to parse JSON response:', responseText.substring(0, 500));
        throw new Error(`Invalid JSON response from Claude: ${error.message}`);
      }
    });
  }

  /**
   * Create a detailed script from a story
   * @param {string} prompt - The script creation prompt
   * @param {Object} masterAnalysis - Full master analysis
   * @param {Object} storyData - Specific story to adapt
   * @returns {Promise<Object>} Script data
   */
  async createScript(prompt, masterAnalysis, storyData) {
    await this.rateLimit();

    return this.withRetry(async () => {
      console.log(`📤 Generating script for: ${storyData.title}...`);

      // Build the full prompt with context
      const fullPrompt = prompt
        .replace('{PASTE ENTIRE MASTER ANALYSIS HERE}', JSON.stringify(masterAnalysis, null, 2))
        .replace('{PASTE SPECIFIC STORY DATA HERE}', JSON.stringify(storyData, null, 2));

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: config.apis.anthropic.temperature,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      });

      this.requestCount++;

      const responseText = message.content[0].text;

      // Extract JSON from response
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        const match = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (match) {
          jsonText = match[1];
        }
      } else if (responseText.includes('```')) {
        const match = responseText.match(/```\n([\s\S]*?)\n```/);
        if (match) {
          jsonText = match[1];
        }
      }

      try {
        return JSON.parse(jsonText.trim());
      } catch (error) {
        console.error('Failed to parse JSON response:', responseText.substring(0, 500));
        throw new Error(`Invalid JSON response from Claude: ${error.message}`);
      }
    });
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      model: this.model
    };
  }
}

export default ClaudeAPI;
