# Output Directory

Your final rendered videos appear here! 🎬

## What's Stored Here

After running `npm run render`, you'll find:
```
short_001.mp4
short_002.mp4
...
short_025.mp4
```

## Video Specifications

- **Format**: MP4 (H.264)
- **Resolution**: 1080x1920 (9:16 vertical)
- **Duration**: 50-65 seconds each
- **FPS**: 30 frames per second
- **Audio**: AAC codec
- **File Size**: ~5-15 MB per video

## Platform Compatibility

These videos are optimized for:
- ✅ TikTok
- ✅ Instagram Reels
- ✅ YouTube Shorts
- ✅ Facebook Reels
- ✅ Snapchat Spotlight

## Upload Guidelines

### TikTok
- Max length: 10 minutes (you're at ~1 min ✓)
- Max size: 287 MB (you're at ~10 MB ✓)
- Formats: MP4, MOV, MPEG, AVI, WEBM
- Recommended hashtags: Check script metadata

### Instagram Reels
- Max length: 90 seconds (you're at ~1 min ✓)
- Max size: 4 GB (you're at ~10 MB ✓)
- Format: MP4
- Aspect ratio: 9:16 (perfect ✓)

### YouTube Shorts
- Max length: 60 seconds (you're at ~55 sec ✓)
- Max size: 256 GB
- Format: MP4, MOV, AVI
- Aspect ratio: 9:16 (perfect ✓)

## Uploading Tips

### Best Posting Times
Check your script's metadata for optimal times, but generally:
- **TikTok**: 7-9 AM, 12-2 PM, 7-9 PM EST
- **Instagram**: 6-9 AM, 12-2 PM, 5-7 PM EST
- **YouTube**: 2-4 PM, 9-11 PM EST

### Captions/Descriptions
Each script includes suggested:
- Hashtags (in metadata.hashtags)
- Title (use as caption)
- Category/niche tags

### Cover Images
TikTok and Instagram will auto-generate, but you can:
- Use frame from first 3 seconds (the hook)
- Create custom cover with key emoji + text
- Use scene 1's visual as thumbnail

## Batch Upload Tools

For efficiency:
- **TikTok**: Use Creator Tools desktop app
- **Instagram**: Buffer, Later, or Hootsuite
- **YouTube**: YouTube Studio bulk upload

## Distribution Strategy

### Week 1: Test Phase
Upload 3-5 videos to see which hooks perform best

### Week 2-4: Scale
- Post 1-2 per day
- Monitor analytics
- Double down on winning formats

### Engagement
- Reply to comments within first hour
- Create follow-up videos for top performers
- Cross-post to all platforms

## Quality Check

Before uploading, verify:
```bash
# Check all videos rendered
ls output/ | wc -l  # Should show 25

# Check file sizes are reasonable
du -h output/

# Validate all videos
npm run validate
```

## Preview on Desktop

```bash
# macOS
open output/short_001.mp4

# Linux
vlc output/short_001.mp4

# Windows
start output/short_001.mp4
```

## Backup Your Videos

These videos are valuable! Back them up:

```bash
# Create a dated backup
zip -r ../shorts_backup_$(date +%Y%m%d).zip output/

# Or use cloud storage
# Upload to Dropbox, Google Drive, etc.
```

## Re-render Individual Videos

If you need to re-render one video after editing its script:

```bash
# Edit the script
nano data/scripts/short_005.json

# Regenerate its assets
npm run generate-assets

# Re-render (will skip existing valid videos)
npm run render
```

## Analytics to Track

After uploading, monitor:
- **Views**: Goal 1000+ in first 48 hours
- **Watch time**: Goal 80%+ retention
- **Engagement**: Likes, comments, shares
- **CTR**: Click-through to profile

## Iterate and Improve

Based on performance:
1. Identify best-performing hooks
2. Edit future scripts to match that style
3. Test different emojis, colors, pacing
4. A/B test hooks from same story

## Going Viral 🚀

If a video hits 100K+ views:
- Create part 2 immediately
- Reference it in new videos
- Pin it to your profile
- Create similar content

## Rights and Compliance

✅ AI-generated narration (ElevenLabs license)
✅ Royalty-free images (Unsplash license)
✅ Book content (fair use: educational commentary)

Always:
- Credit the book and author in description
- Don't claim stories as your own
- Mark as "educational content"
- Follow platform community guidelines

## Monetization

### TikTok Creator Fund
- Requires: 10K followers, 100K views/30 days
- Earnings: ~$0.02-0.04 per 1000 views

### YouTube Partner Program
- Requires: 1K subscribers, 10M Shorts views/90 days
- Earnings: Share of ad revenue

### Instagram Bonuses
- Invitation only, varies by region
- Earnings: Up to $35K for high performers

### Sponsorships
Once you have 10K+ followers, brands will reach out

## Need More Videos?

Process another book:
```bash
cp ~/Downloads/another-book.pdf data/books/
npm run full-pipeline
```

**Good luck going viral! 🎉**
