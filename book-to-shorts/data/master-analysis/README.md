# Master Analysis Directory

This directory contains the analysis results from Step 1 (Book Analysis).

## What's Stored Here

After running `npm run analyze`, you'll find JSON files like:
```
BOOKNAME.json
```

Each file contains:
- Book metadata (title, author, pages)
- Style guide for video creation
- 25 viral-worthy stories identified from the book

## File Structure

```json
{
  "book_info": {
    "title": "Book Title",
    "author": "Author Name",
    "total_pages": 300,
    "main_themes": ["power", "strategy"],
    "target_audience": "entrepreneurs"
  },
  "style_guide": {
    "tone": "Dark, matter-of-fact",
    "pacing": "Quick cuts, tension building",
    "color_palette": {...}
  },
  "viral_stories": [
    {
      "story_id": 1,
      "title": "Story Title",
      "viral_potential": {
        "total_score": 9.5
      },
      ...
    }
  ]
}
```

## What Happens Next

This analysis is used by Step 2 (Create Scripts) to generate detailed video scripts for each story.

## Customization

You can manually edit these files to:
- Remove stories you don't want
- Adjust the style guide
- Reorder stories by priority
- Change target viral potential threshold

After editing, re-run:
```bash
npm run create-scripts
```

## Review Tips

Look for:
- Stories with high viral_potential scores (8+)
- Clear, self-contained narratives
- Modern relevance
- Strong hook options
