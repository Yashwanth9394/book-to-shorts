# Book to Viral Shorts

Automatically transform PDF books into 25 engaging 60-second TikTok/Instagram Reels using AI.

## Overview

This system uses Claude AI to analyze books, identify viral-worthy stories, and generate complete video scripts. It then creates professional videos with AI voiceovers, stock images, and dynamic animations - all automatically.

### What It Does

1. **Analyzes** a PDF book to find the 25 most viral-worthy stories
2. **Creates** detailed 60-second video scripts for each story
3. **Generates** AI voiceovers using ElevenLabs
4. **Fetches** relevant stock images from Unsplash
5. **Renders** professional 9:16 videos using Remotion

### Output

- 25 ready-to-upload MP4 videos (1080x1920)
- Each 50-65 seconds long
- Professional voiceover narration
- Dynamic text animations
- High-quality visuals
- Optimized for TikTok/Instagram Reels

## Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **API Keys** (see Setup below)

## Installation

```bash
# Clone or download this repository
cd book-to-shorts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys
```

## Setup

You'll need API keys from these services:

### 1. Anthropic (Claude AI)
- Sign up at: https://console.anthropic.com/
- Get your API key
- Add to `.env`: `ANTHROPIC_API_KEY=your_key_here`

### 2. ElevenLabs (AI Voice)
- Sign up at: https://elevenlabs.io/
- Get your API key
- Add to `.env`: `ELEVENLABS_API_KEY=your_key_here`

### 3. Unsplash (Stock Images)
- Sign up at: https://unsplash.com/developers
- Create an app and get access key
- Add to `.env`: `UNSPLASH_ACCESS_KEY=your_key_here`

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Usage

### Quick Start

```bash
# 1. Add your PDF book to data/books/
cp /path/to/your/book.pdf data/books/

# 2. Run the complete pipeline
npm run full-pipeline

# 3. Find your videos in output/
ls output/
```

### Step-by-Step

Run each step individually for more control:

```bash
# Step 1: Analyze the book
npm run analyze
# Output: data/master-analysis/BOOKNAME.json

# Step 2: Create video scripts
npm run create-scripts
# Output: data/scripts/short_001.json ... short_025.json

# Step 3: Generate assets (audio + images)
npm run generate-assets
# Output: data/assets/audio/*.mp3, data/assets/images/*.jpg

# Step 4: Render videos
npm run render
# Output: output/short_001.mp4 ... short_025.mp4

# Step 5: Validate everything
npm run validate
```

## Project Structure

```
book-to-shorts/
├── package.json           # Dependencies and scripts
├── .env                   # API keys (create from .env.example)
├── README.md             # This file
├── docs/
│   └── SETUP.md          # Detailed setup guide
├── scripts/
│   ├── 1-analyze-book.js      # Book analysis
│   ├── 2-create-scripts.js    # Script generation
│   ├── 3-generate-assets.js   # Asset creation
│   ├── 4-render-videos.js     # Video rendering
│   └── 5-validate.js          # Validation
├── src/
│   ├── config/
│   │   └── config.js          # Configuration
│   ├── prompts/
│   │   ├── master-analysis.txt    # Analysis prompt
│   │   └── script-creation.txt    # Script prompt
│   ├── utils/
│   │   ├── claude-api.js      # Claude API wrapper
│   │   ├── file-utils.js      # File operations
│   │   └── validators.js      # Validation logic
│   └── video/
│       ├── Root.jsx           # Remotion root
│       ├── Video.jsx          # Main video component
│       └── Scene.jsx          # Scene component
├── data/
│   ├── books/            # Put PDF books here
│   ├── master-analysis/  # Analysis outputs
│   ├── scripts/          # Video scripts
│   └── assets/
│       ├── images/       # Generated images
│       ├── audio/        # Generated voiceovers
│       └── music/        # Background music (optional)
└── output/               # Final MP4 videos
```

## Configuration

Edit `src/config/config.js` to customize:

- Video dimensions (default: 1080x1920)
- Frame rate (default: 30fps)
- Duration limits (default: 50-65 seconds)
- Scene count (default: 10-12 scenes)
- API rate limits
- Retry policies

## Cost Estimate

Typical costs for processing one book (25 videos):

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| Claude API | ~27 requests | $2-5 |
| ElevenLabs | ~300 audio clips | $5-10 |
| Unsplash | Free tier | $0 |
| **Total** | | **$7-15** |

Costs vary based on:
- Book length (affects token usage)
- Number of images needed
- ElevenLabs plan (free tier available)

## Tips for Best Results

### Choosing Books

Best book types:
- History with dramatic stories
- Business/psychology with case studies
- Biographies with interesting anecdotes
- Philosophy with concrete examples

Avoid:
- Dense technical books
- Abstract theory without stories
- Books without clear narratives

### Optimizing Output

- Review `data/master-analysis/` to see selected stories
- Edit scripts in `data/scripts/` before rendering if needed
- Adjust style guide in prompts for different tones
- Re-run individual steps if needed (scripts are idempotent)

## Troubleshooting

### "No PDF files found"
- Make sure your PDF is in `data/books/`
- Check file has `.pdf` extension

### "Invalid JSON response from Claude"
- Claude may have hit rate limits - wait and retry
- Check your API key is valid
- Book might be too long - try truncating

### "Audio generation failed"
- Check ElevenLabs API key
- Verify you have quota remaining
- Some text may be too long - edit script

### "Video rendering failed"
- Ensure all assets were generated (run `npm run validate`)
- Check that Remotion is installed
- Review error logs for specific issues

### General Issues
- Run `npm run validate` to see what's missing
- Check `.env` file has all required keys
- Ensure you have Node.js v18+

## Advanced Usage

### Processing Multiple Books

```bash
# Add multiple PDFs to data/books/
# The scripts will process them sequentially
```

### Custom Prompts

Edit prompt templates in `src/prompts/`:
- `master-analysis.txt` - Controls story selection
- `script-creation.txt` - Controls script style

### Custom Voices

Change voice ID in `.env`:
```bash
VOICE_ID=your_preferred_voice_id
```

Find voice IDs at: https://elevenlabs.io/voice-library

### Background Music

Add MP3 files to `data/assets/music/` and reference them in scripts.

## Examples

Sample output structure:

```
output/
├── short_001.mp4  # "The Trojan Horse Strategy"
├── short_002.mp4  # "How Xerxes Lost an Empire"
├── short_003.mp4  # "The Art of Strategic Retreat"
...
└── short_025.mp4  # "The Price of Hubris"
```

Each video includes:
- Hook (3 seconds) - Attention-grabbing opener
- Story (40-50 seconds) - The main narrative
- Lesson (5-8 seconds) - Key takeaway
- CTA (3-4 seconds) - Like/follow prompt

## License

MIT License - feel free to use commercially

## Credits

Built with:
- [Claude AI](https://anthropic.com) by Anthropic
- [ElevenLabs](https://elevenlabs.io) for voice generation
- [Remotion](https://remotion.dev) for video rendering
- [Unsplash](https://unsplash.com) for stock images

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Review [docs/SETUP.md](docs/SETUP.md)
3. Open an issue on GitHub

## Roadmap

Future enhancements:
- [ ] Support for Midjourney images
- [ ] Custom fonts and styling
- [ ] Batch processing optimization
- [ ] Video preview before rendering
- [ ] Direct upload to TikTok/Instagram APIs
- [ ] Analytics integration
- [ ] Template system for different niches

---

**Ready to create viral content? Add a PDF book and run `npm run full-pipeline`!** 🚀
