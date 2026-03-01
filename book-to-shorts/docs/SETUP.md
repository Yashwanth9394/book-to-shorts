# Detailed Setup Guide

This guide walks you through setting up the Book to Viral Shorts system from scratch.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installing Node.js](#installing-nodejs)
3. [Getting API Keys](#getting-api-keys)
4. [Project Installation](#project-installation)
5. [Configuration](#configuration)
6. [First Run](#first-run)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **Operating System**: macOS, Linux, or Windows 10+
- **Node.js**: v18.0.0 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space (more for output videos)
- **Internet**: Stable connection for API calls

### Recommended Setup

- **Node.js**: v20.x (LTS)
- **RAM**: 16GB
- **Storage**: 10GB+ SSD
- **CPU**: Multi-core processor (for faster rendering)

## Installing Node.js

### macOS

Using Homebrew:
```bash
brew install node@20
```

Or download from: https://nodejs.org/

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Windows

Download installer from: https://nodejs.org/

Or using Chocolatey:
```powershell
choco install nodejs-lts
```

### Verify Installation

```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
```

## Getting API Keys

### 1. Anthropic API (Claude)

**Cost**: Pay-as-you-go (typically $2-5 per book)

**Steps**:

1. Go to https://console.anthropic.com/
2. Click "Sign Up" (or "Log In" if you have an account)
3. Verify your email
4. Go to "API Keys" section
5. Click "Create Key"
6. Copy your API key (starts with `sk-ant-...`)
7. Add credits to your account (minimum $5 recommended)

**Important Notes**:
- Keep your key secret - never share it publicly
- Monitor usage in the Anthropic console
- Set up billing alerts if available

**Testing Your Key**:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY_HERE" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

### 2. ElevenLabs API (Voice Generation)

**Cost**: Free tier available (10,000 characters/month), paid plans start at $5/month

**Steps**:

1. Go to https://elevenlabs.io/
2. Click "Get Started" and sign up
3. Verify your email
4. Go to your profile (top-right corner)
5. Click "Profile + API Key"
6. Copy your API key (starts with `sk_...`)

**Free Tier Notes**:
- 10,000 characters per month
- Enough for ~3-4 books (25 videos each)
- Can upgrade anytime for more quota

**Voice Selection**:

The default voice is "Adam" (ID: `pNInz6obpgDQGcFmaJgB`) - a deep, dramatic male voice.

To use a different voice:
1. Go to https://elevenlabs.io/voice-library
2. Browse and select a voice
3. Click "Use"
4. Copy the Voice ID
5. Update `.env`: `VOICE_ID=your_voice_id_here`

**Testing Your Key**:
```bash
curl -X GET https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: YOUR_KEY_HERE"
```

### 3. Unsplash API (Stock Images)

**Cost**: Free (50 requests per hour)

**Steps**:

1. Go to https://unsplash.com/developers
2. Click "Register as a developer"
3. Accept the terms
4. Click "Your apps" → "New Application"
5. Fill in application details:
   - Application name: "Book to Shorts"
   - Description: "Generate images for video content"
6. Accept API terms
7. Copy your "Access Key"

**Rate Limits**:
- Demo: 50 requests/hour
- Production: 5,000 requests/hour (after approval)

For 25 videos, you typically need 50-100 images, which fits in the demo tier if you spread requests over time.

**Testing Your Key**:
```bash
curl "https://api.unsplash.com/photos/random" \
  -H "Authorization: Client-ID YOUR_KEY_HERE"
```

## Project Installation

### 1. Download/Clone Project

```bash
# If using Git
git clone <repository-url>
cd book-to-shorts

# Or if downloaded as ZIP
unzip book-to-shorts.zip
cd book-to-shorts
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Anthropic SDK
- ElevenLabs client
- Remotion (video rendering)
- PDF parsing library
- Other utilities

Expected time: 2-5 minutes

### 3. Verify Installation

```bash
npm list --depth=0
```

You should see all dependencies listed without errors.

## Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Edit Environment File

Open `.env` in your text editor:

```bash
# macOS/Linux
nano .env

# Or use your preferred editor
code .env  # VS Code
vim .env   # Vim
```

### 3. Add Your API Keys

```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
ELEVENLABS_API_KEY=sk_xxxxx
UNSPLASH_ACCESS_KEY=xxxxx

# Optional (defaults are fine)
VOICE_ID=pNInz6obpgDQGcFmaJgB
VOICE_MODEL=eleven_turbo_v2
VIDEO_FPS=30
VIDEO_WIDTH=1080
VIDEO_HEIGHT=1920
```

### 4. Verify Configuration

```bash
node -e "require('dotenv').config(); console.log(process.env.ANTHROPIC_API_KEY ? 'Keys loaded!' : 'Keys missing!')"
```

Should print: `Keys loaded!`

## First Run

### 1. Prepare a Test Book

Start with a smaller PDF (under 100 pages) for testing:

```bash
# Add your PDF to the books folder
cp /path/to/your/book.pdf data/books/
```

**Good test books**:
- "The Art of War" by Sun Tzu
- "The Prince" by Machiavelli
- "Meditations" by Marcus Aurelius
- Any book with clear stories/examples

### 2. Run Analysis (Step 1)

```bash
npm run analyze
```

**What to expect**:
- Takes 30-60 seconds
- You'll see progress messages
- Output: `data/master-analysis/BOOKNAME.json`

**Success looks like**:
```
✅ Configuration valid
✅ Found 1 book(s)
📄 Extracting text from PDF...
✅ PDF extracted successfully
🤖 Sending to Claude for analysis...
✅ Analysis received from Claude
✅ ANALYSIS COMPLETE!
```

### 3. Review Analysis

```bash
# View the generated analysis
cat data/master-analysis/*.json | head -100
```

Check that:
- 25 stories were identified
- Each has a viral_potential score
- Style guide is present

### 4. Generate Scripts (Step 2)

```bash
npm run create-scripts
```

**What to expect**:
- Takes 5-10 minutes (25 API calls)
- Progress bar shows current story
- Output: 25 JSON files in `data/scripts/`

**Warning**: This step makes 25 API calls to Claude. Cost: ~$2-3.

### 5. Generate Assets (Step 3)

```bash
npm run generate-assets
```

**What to expect**:
- Takes 10-20 minutes
- Generates 250-300 audio files
- Fetches 50-100 images
- Progress bar shows current asset

**Notes**:
- ElevenLabs has rate limits (wait between requests)
- Unsplash has 50 requests/hour limit
- Script will automatically wait between requests

### 6. Render Videos (Step 4)

```bash
npm run render
```

**What to expect**:
- Takes 30-60 minutes for 25 videos
- Each video takes 1-3 minutes to render
- Progress bar shows current video
- Output: 25 MP4 files in `output/`

**CPU/RAM Note**: Rendering is intensive. Your computer may slow down during this step.

### 7. Validate Everything

```bash
npm run validate
```

**Success looks like**:
```
✅ Scripts: PASS
✅ Audio Assets: PASS
✅ Image Assets: PASS
✅ Videos: PASS

🎉 VALIDATION PASSED! ALL SYSTEMS GO!
```

## Troubleshooting

### "Missing required environment variables"

**Problem**: API keys not loaded

**Solution**:
```bash
# Check .env file exists
ls -la .env

# Check .env has keys
cat .env

# Make sure no extra spaces
# Wrong: ANTHROPIC_API_KEY= sk-ant-...
# Right: ANTHROPIC_API_KEY=sk-ant-...
```

### "Failed to read PDF"

**Problem**: PDF is corrupted or encrypted

**Solution**:
- Try a different PDF
- Make sure PDF is not password-protected
- Convert PDF using online tools if needed

### "Rate limited by API"

**Problem**: Too many requests too fast

**Solution**:
- Wait a few minutes and retry
- The script has built-in rate limiting
- For ElevenLabs: upgrade to paid plan for higher limits

### "Invalid JSON response from Claude"

**Problem**: Claude's response couldn't be parsed

**Solution**:
- Retry the command (sometimes it's temporary)
- Check your API key is valid
- Ensure you have credits in your account

### "Audio generation failed"

**Problem**: ElevenLabs API error

**Solution**:
```bash
# Check your quota
curl -X GET https://api.elevenlabs.io/v1/user \
  -H "xi-api-key: YOUR_KEY"

# Re-run just asset generation
npm run generate-assets
```

### "No images found for query"

**Problem**: Unsplash couldn't find matching image

**Solution**:
- This is usually okay - not all scenes need images
- The script will continue with other assets
- You can manually add images to `data/assets/images/`

### "Video rendering failed"

**Problem**: Remotion can't render

**Solution**:
```bash
# Verify Remotion is installed
npx remotion --version

# Re-install if needed
npm install remotion @remotion/cli

# Check all assets exist
npm run validate
```

### "Out of memory" during rendering

**Problem**: Not enough RAM

**Solution**:
- Render videos in smaller batches
- Close other applications
- Increase Node.js memory:
  ```bash
  export NODE_OPTIONS="--max-old-space-size=8192"
  npm run render
  ```

## Advanced Configuration

### Customizing Video Style

Edit `src/prompts/script-creation.txt` to change:
- Tone (dark, upbeat, educational, etc.)
- Text style and colors
- Scene pacing
- Emoji usage

### Changing Video Format

Edit `src/config/config.js`:

```javascript
video: {
  fps: 30,           // Frame rate
  width: 1080,       // Width in pixels
  height: 1920,      // Height (9:16 for TikTok)
  codec: 'h264',     // Video codec
  quality: 18        // Lower = better quality (18-28)
}
```

For YouTube Shorts (also 9:16):
- No changes needed, same format

For Instagram Feed (1:1):
```javascript
width: 1080,
height: 1080
```

### Using Different AI Models

Edit `src/config/config.js`:

```javascript
anthropic: {
  model: 'claude-sonnet-4-20250514',  // Current
  // or: 'claude-3-5-sonnet-20241022'  // Faster, cheaper
  // or: 'claude-3-opus-20240229'      // Most capable
}
```

## Next Steps

Once setup is complete:

1. **Test with one book** - Verify everything works
2. **Review outputs** - Check quality of videos
3. **Adjust prompts** - Customize style to your taste
4. **Process more books** - Scale up production
5. **Upload to platforms** - Start getting views!

## Getting Help

If you're still stuck:

1. Check error messages carefully
2. Review logs in terminal
3. Run `npm run validate` to see what's missing
4. Check API status pages:
   - Anthropic: https://status.anthropic.com/
   - ElevenLabs: https://status.elevenlabs.io/
5. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your system info (`node --version`, OS)

## Success Checklist

- [ ] Node.js v18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] API keys added to `.env`
- [ ] Test PDF added to `data/books/`
- [ ] Successfully ran `npm run analyze`
- [ ] Successfully ran `npm run create-scripts`
- [ ] Successfully ran `npm run generate-assets`
- [ ] Successfully ran `npm run render`
- [ ] `npm run validate` passes
- [ ] Videos play correctly in `output/`

**Congratulations! You're ready to create viral content! 🎉**
