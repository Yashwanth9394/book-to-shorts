# Video Scripts Directory

This directory contains the detailed video scripts generated in Step 2.

## What's Stored Here

After running `npm run create-scripts`, you'll find:
```
short_001.json
short_002.json
...
short_025.json
_summary.json (overview of all scripts)
```

## Script Structure

Each script file contains:
- Video metadata (title, duration, category)
- 10-12 scenes with timing
- Visual specifications for each scene
- Audio/narration for each scene
- Assets needed (images, music)

Example:
```json
{
  "short_id": 1,
  "title": "The Trojan Horse Strategy",
  "timeline": {
    "total_duration_ms": 55000
  },
  "scenes": [
    {
      "scene_number": 1,
      "scene_type": "HOOK",
      "duration_ms": 3000,
      "visuals": {
        "emoji": "🐴",
        "text_on_screen": "They hid inside\na wooden horse"
      },
      "audio": {
        "narration_text": "They hid inside a wooden horse"
      }
    },
    ...
  ]
}
```

## Customization

You can manually edit scripts before generating assets:

### Change Text
```json
"text_on_screen": "Your custom text here"
```

### Adjust Timing
```json
"duration_ms": 4000  // Change scene length
```

### Change Colors
```json
"background": "bg-red",
"text_color": "white"
```

### Add/Remove Scenes
- Keep 10-12 scenes total
- Update start_time_ms and end_time_ms
- Update total_duration_ms

### Modify Narration
```json
"narration_text": "Your custom narration"
```

## After Editing

Re-run subsequent steps:
```bash
npm run generate-assets  # Regenerate audio for new narration
npm run render           # Render with new script
```

## Validation

Check your edits:
```bash
npm run validate
```

## Tips

- Keep narration under 12 words per scene for pacing
- First scene must be HOOK (attention grabber)
- Last scene must be CTA (call to action)
- Total duration: 50-65 seconds
- Text should be readable on mobile (short lines)

## Common Edits

### Make it longer
Add a scene:
```json
{
  "scene_number": 8,
  "scene_type": "STORY",
  "duration_ms": 5000,
  ...
}
```
Update total_duration_ms

### Make it shorter
Remove a low-importance scene (check `can_be_cut: true`)
Update scene numbers and timings

### Change style
Edit visuals.background for all scenes:
- Dark theme: "bg-black"
- Bold theme: "bg-red"
- Professional: "bg-blue"

### Swap stories
Rename files to reorder:
```bash
mv short_001.json short_026_temp.json
mv short_005.json short_001.json
mv short_026_temp.json short_005.json
```
