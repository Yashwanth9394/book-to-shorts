# Book to Shorts

An automated AI-powered pipeline that converts books into short-form video content. Analyzes books, generates scripts, creates visual assets, and renders videos.

## Features

- Book analysis using Claude AI for key themes and quotes
- Automated script generation for short-form content
- Visual asset generation with placeholder music
- Video rendering pipeline with Remotion
- Configurable templates and styles
- Pipeline validation at each stage

## Tech Stack

- **Runtime:** Node.js
- **AI:** Claude API (Anthropic) for book analysis and script generation
- **Video:** Remotion (React-based video rendering)
- **Styling:** Tailwind CSS for video scenes

## Pipeline Stages

```
1. Analyze Book    --> Extract themes, quotes, key insights
2. Create Scripts  --> Generate video scripts from analysis
3. Generate Assets --> Create visuals and music
4. Render Videos   --> Produce final short-form videos
5. Validate        --> Quality check all outputs
```

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key

### Installation
```bash
cd book-to-shorts
npm install
cp .env.example .env  # Add your API keys
```

### Usage
```bash
node scripts/1-analyze-book.js
node scripts/2-create-scripts.js
node scripts/3-generate-assets.js
node scripts/4-render-videos.js
node scripts/5-validate.js
```

## Project Structure

```
book-to-shorts/
├── scripts/          # Pipeline stage scripts
├── src/
│   ├── config/       # Configuration
│   ├── prompts/      # AI prompt templates
│   ├── utils/        # Claude API, file utils, validators
│   └── video/        # Remotion video components
├── data/
│   ├── books/        # Input books
│   ├── master-analysis/  # AI analysis output
│   └── scripts/      # Generated scripts
└── output/           # Final rendered videos
```
