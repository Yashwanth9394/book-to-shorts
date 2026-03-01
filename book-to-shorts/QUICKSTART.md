# Quick Start Guide

Get your first viral shorts in 10 minutes!

## Prerequisites

You'll need:
- Node.js v18+ installed
- 3 API keys (free tiers available)

## Setup (5 minutes)

### 1. Install Dependencies

```bash
cd book-to-shorts
npm install
```

### 2. Get API Keys

**Anthropic (Claude)** - https://console.anthropic.com/
- Sign up → Get API key → Add $5 credits

**ElevenLabs (Voice)** - https://elevenlabs.io/
- Sign up → Profile → Copy API key (free tier: 10k chars/month)

**Unsplash (Images)** - https://unsplash.com/developers
- Register → New App → Copy Access Key (free: 50 requests/hour)

### 3. Configure

```bash
cp .env.example .env
nano .env  # or use your editor
```

Add your keys:
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
ELEVENLABS_API_KEY=sk_xxxxx
UNSPLASH_ACCESS_KEY=xxxxx
```

## Create Your First Shorts (5 minutes setup + processing time)

### 1. Add a Book

```bash
# Copy your PDF to the books folder
cp ~/Downloads/your-book.pdf data/books/
```

### 2. Run the Pipeline

```bash
npm run full-pipeline
```

This will:
1. Analyze the book (30-60 seconds)
2. Create 25 scripts (5-10 minutes)
3. Generate audio & images (10-20 minutes)
4. Render 25 videos (30-60 minutes)

**Total time: ~45-90 minutes** (runs automatically)

### 3. Get Your Videos

```bash
ls output/
# short_001.mp4 ... short_025.mp4
```

## Step-by-Step (Optional)

Run each step individually:

```bash
# 1. Analyze
npm run analyze
# Check: data/master-analysis/BOOK.json

# 2. Create scripts
npm run create-scripts
# Check: data/scripts/short_001.json

# 3. Generate assets
npm run generate-assets
# Check: data/assets/audio/ and data/assets/images/

# 4. Render videos
npm run render
# Check: output/short_001.mp4

# 5. Validate
npm run validate
```

## Quick Test

Want to test before processing a full book?

1. Use a smaller PDF (under 50 pages)
2. Manually edit `src/config/config.js`:
   ```javascript
   limits: {
     targetStories: 5  // Instead of 25
   }
   ```
3. Run pipeline - will create only 5 videos

## Cost Estimate

For one book (25 videos):
- Claude: $2-5
- ElevenLabs: $0-5 (free tier may cover it)
- Unsplash: $0 (free)
- **Total: ~$2-10**

## Common Issues

### "Missing API keys"
```bash
# Make sure .env exists and has keys
cat .env
```

### "No PDF found"
```bash
# Check book is in right place
ls data/books/
```

### "Out of quota"
- ElevenLabs: Wait or upgrade plan
- Unsplash: Wait 1 hour or upgrade
- Claude: Add more credits

## What's Next?

1. **Review outputs** - Watch your videos
2. **Customize style** - Edit `src/prompts/script-creation.txt`
3. **Process more books** - Add more PDFs
4. **Upload & grow** - Post to TikTok/Instagram

## Need Help?

- Full docs: [README.md](README.md)
- Detailed setup: [docs/SETUP.md](docs/SETUP.md)
- Issues: Open a GitHub issue

## Success! 🎉

If you see:
```
✅ VALIDATION PASSED! ALL SYSTEMS GO!
```

You're ready to upload and go viral! 🚀

---

**Pro Tip**: Start with "The 48 Laws of Power", "Art of War", or "Meditations" - they generate highly engaging content!
