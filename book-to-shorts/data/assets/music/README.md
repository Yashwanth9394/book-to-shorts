# Background Music Directory

Place background music MP3 files here for use in your videos.

## How Background Music Works

Background music is **optional**. If you want to add music to your videos:

1. Add MP3 files to this directory
2. The script creation process can reference them
3. Music plays at low volume (15%) behind narration

## Getting Music

### Free Sources (Royalty-Free)

1. **YouTube Audio Library**
   - https://studio.youtube.com/channel/UC/music
   - Free, no attribution required
   - Filter by "Suspenseful", "Dark", "Dramatic"

2. **Free Music Archive**
   - https://freemusicarchive.org/
   - Free with attribution
   - Search for "cinematic" or "suspense"

3. **Pixabay Music**
   - https://pixabay.com/music/
   - Free, no attribution required
   - Good selection of dramatic tracks

4. **Incompetech**
   - https://incompetech.com/music/
   - Free with attribution
   - Filter by mood: "Dark", "Suspenseful"

### Paid Sources (Higher Quality)

1. **Epidemic Sound** ($15/month)
2. **Artlist** ($9.99/month)
3. **AudioJungle** (per-track pricing)

## Recommended Tracks

For viral shorts, use music that:
- Builds tension
- Is subtle (won't overpower voice)
- Matches the mood (dark, suspenseful, dramatic)
- Loops well (for variable video lengths)

## File Requirements

- Format: MP3
- Length: 60+ seconds (or loopable)
- Quality: 128kbps minimum
- Volume: Will be set to 15% in videos

## Example File Names

```
suspense-rising.mp3
dark-tension.mp3
dramatic-reveal.mp3
ominous-background.mp3
epic-build.mp3
```

## How to Reference in Scripts

If you manually edit scripts, reference music like:

```json
"audio": {
  "narration_text": "...",
  "background_music": "suspense-rising.mp3",
  "music_volume": 0.15
}
```

## Pro Tips

- Use the same track across all scenes for consistency
- Lower volume (0.10-0.15) lets voice dominate
- Match music intensity to scene emotion
- Test on mobile with headphones

## No Music?

Videos work great without background music too! The AI-generated voice and visuals are engaging on their own.
