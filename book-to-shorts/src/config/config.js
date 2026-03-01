import dotenv from 'dotenv';

dotenv.config();

const config = {
  apis: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 8000,
      temperature: 1.0
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
      modelId: process.env.VOICE_MODEL || 'eleven_turbo_v2',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true
    },
    unsplash: {
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
      perPage: 1,
      orientation: 'portrait'
    }
  },
  video: {
    fps: parseInt(process.env.VIDEO_FPS || '30'),
    width: parseInt(process.env.VIDEO_WIDTH || '1080'),
    height: parseInt(process.env.VIDEO_HEIGHT || '1920'),
    codec: 'h264',
    quality: 18,
    pixelFormat: 'yuv420p'
  },
  limits: {
    minDuration: 50000, // milliseconds
    maxDuration: 65000, // milliseconds
    minScenes: 10,
    maxScenes: 12,
    targetStories: 25
  },
  paths: {
    books: './data/books',
    masterAnalysis: './data/master-analysis',
    scripts: './data/scripts',
    images: './data/assets/images',
    audio: './data/assets/audio',
    music: './data/assets/music',
    output: './output'
  },
  rateLimits: {
    anthropic: {
      requestsPerMinute: 50,
      delayBetweenRequests: 1200 // ms
    },
    elevenlabs: {
      requestsPerMinute: 10,
      delayBetweenRequests: 6000 // ms
    },
    unsplash: {
      requestsPerHour: 50,
      delayBetweenRequests: 2000 // ms
    }
  },
  retryPolicy: {
    maxRetries: 3,
    initialDelay: 1000, // ms
    backoffMultiplier: 2
  }
};

// Validate required environment variables
export function validateConfig() {
  const required = [
    'ANTHROPIC_API_KEY',
    'ELEVENLABS_API_KEY',
    'UNSPLASH_ACCESS_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in your API keys.'
    );
  }
}

export default config;
