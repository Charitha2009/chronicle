# AI Integration for Chronicle

This document describes the AI integration that allows Chronicle to automatically suggest story genres and generate story content based on characters in the room.

## Features

### 1. AI-Powered Genre Selection
- Analyzes characters in the campaign to suggest the most fitting genre
- Uses OpenAI GPT-4 to understand character archetypes and their narrative potential
- Provides confidence scores and reasoning for suggestions

### 2. AI-Powered Story Generation
- Generates opening scenes based on characters and selected genre
- Creates compelling story hooks for player choices
- Maintains narrative consistency across turns
- Adapts story content based on previous player actions

## API Endpoints

### Genre Suggestion
```
POST /campaigns/:id/suggest-genre
```
Analyzes locked characters and returns a genre suggestion with confidence score and reasoning.

### Story Generation
```
POST /campaigns/:id/generate-story
Body: { genre, turnIndex, selectedHook }
```
Generates story content for a specific turn based on characters and previous story context.

## Setup

1. Install OpenAI dependency:
```bash
cd apps/api
npm install openai
```

2. Set environment variables:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. The AI service will automatically be used when starting campaigns and generating story content.

## Usage

### For Players
1. Create characters in the character selection page
2. Click "🤖 Get AI Genre Suggestion" to let AI analyze your characters
3. Accept the AI suggestion or choose manually
4. Start the campaign with AI-generated opening scenes

### For Developers
The AI service is integrated into the existing campaign flow:
- Genre suggestions are available after characters are locked
- Story generation happens automatically when campaigns start
- Fallback content is provided if AI service fails

## AI Service Architecture

The `AIService` class provides three main methods:

1. `suggestGenre(characters)` - Analyzes characters and suggests optimal genre
2. `generateStoryContent(characters, genre, title, turnIndex)` - Creates opening scenes
3. `generateStoryContinuation(characters, genre, title, previousTurns, selectedHook, turnIndex)` - Continues story based on player choices

## Error Handling

The system includes robust error handling:
- Fallback content if AI service is unavailable
- Graceful degradation to manual genre selection
- Error logging for debugging

## Future Enhancements

- Character relationship analysis for better genre suggestions
- Dynamic story adaptation based on player behavior
- Multiple AI model support
- Custom prompt templates for different genres
