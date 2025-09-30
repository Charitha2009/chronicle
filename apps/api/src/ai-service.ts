import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface Character {
  id: number;
  name: string;
  archetype: string;
  avatar_url?: string;
}

export interface GenreSuggestion {
  genre: string;
  confidence: number;
  reasoning: string;
}

export interface StoryContent {
  content: string;
  hooks: string[];
  memory_summary: string;
}

export class AIService {
  /**
   * Analyze characters and suggest the best genre for the story
   */
  static async suggestGenre(characters: Character[]): Promise<GenreSuggestion> {
    // Check if OpenAI is available
    if (!openai) {
      console.log('OpenAI not available, using fallback genre suggestion');
      return {
        genre: 'adventure',
        confidence: 0.3,
        reasoning: 'AI service not configured - using default adventure genre'
      };
    }

    const characterDescriptions = characters.map(char => 
      `${char.name} (${char.archetype})`
    ).join(', ');

    const prompt = `You are an expert storyteller and game master. Analyze these characters and suggest the most fitting genre for their story:

Characters: ${characterDescriptions}

Available genres: dark_fantasy, space_opera, mystery, post_apoc, pirate, fantasy, scifi, horror, adventure, romance

Consider:
- Character archetypes and how they work together
- Narrative potential and conflict opportunities
- Genre tropes that would enhance the story
- Player engagement and excitement

Respond with a JSON object containing:
- genre: the suggested genre (use the exact genre name from the list)
- confidence: a number from 0-1 indicating how confident you are
- reasoning: a brief explanation of why this genre fits best`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const parsed = JSON.parse(response);
      return {
        genre: parsed.genre,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Error in AI genre suggestion:', error);
      // Fallback to adventure genre
      return {
        genre: 'adventure',
        confidence: 0.5,
        reasoning: 'Fallback genre due to AI service error'
      };
    }
  }

  /**
   * Generate story content based on characters and genre
   */
  static async generateStoryContent(
    characters: Character[], 
    genre: string, 
    campaignTitle: string,
    turnIndex: number = 1
  ): Promise<StoryContent> {
    // Check if OpenAI is available
    if (!openai) {
      console.log('OpenAI not available, using fallback story content');
      return {
        content: `Welcome to your ${genre} adventure: ${campaignTitle}!\n\nYou find yourself at the beginning of an epic journey. The world around you is filled with possibilities and danger lurks in every shadow. Your choices will shape the destiny of this tale.\n\nWhat will you do next?`,
        hooks: [
          "Investigate the mysterious light in the distance",
          "Seek shelter and plan your next move", 
          "Call out to see if anyone else is nearby"
        ],
        memory_summary: `Opening scene of ${campaignTitle} - players begin their ${genre} adventure`
      };
    }

    const characterDescriptions = characters.map(char => 
      `${char.name} (${char.archetype})`
    ).join(', ');

    const prompt = `You are a master storyteller creating an engaging ${genre} story. Generate an opening scene and story hooks based on these characters:

Campaign: ${campaignTitle}
Genre: ${genre}
Characters: ${characterDescriptions}
Turn: ${turnIndex}

Create:
1. An engaging opening scene (2-3 paragraphs) that introduces the characters and sets the tone for a ${genre} adventure
2. Three compelling story hooks that give players meaningful choices to drive the narrative forward

The story should:
- Be appropriate for the ${genre} genre
- Incorporate all the characters naturally
- Create immediate tension or intrigue
- Offer meaningful player agency through the hooks
- Be engaging and immersive

Respond with a JSON object containing:
- content: the opening scene text
- hooks: array of 3 story hook options
- memory_summary: a brief summary for the AI's memory of this scene`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const parsed = JSON.parse(response);
      return {
        content: parsed.content,
        hooks: parsed.hooks,
        memory_summary: parsed.memory_summary
      };
    } catch (error) {
      console.error('Error in AI story generation:', error);
      // Fallback content
      return {
        content: `Welcome to your ${genre} adventure: ${campaignTitle}!\n\nYou find yourself at the beginning of an epic journey. The world around you is filled with possibilities and danger lurks in every shadow. Your choices will shape the destiny of this tale.\n\nWhat will you do next?`,
        hooks: [
          "Investigate the mysterious light in the distance",
          "Seek shelter and plan your next move", 
          "Call out to see if anyone else is nearby"
        ],
        memory_summary: `Opening scene of ${campaignTitle} - players begin their ${genre} adventure`
      };
    }
  }

  /**
   * Generate story continuation based on previous turns and character actions
   */
  static async generateStoryContinuation(
    characters: Character[],
    genre: string,
    campaignTitle: string,
    previousTurns: any[],
    selectedHook: string,
    turnIndex: number
  ): Promise<StoryContent> {
    // Check if OpenAI is available
    if (!openai) {
      console.log('OpenAI not available, using fallback story continuation');
      return {
        content: `The story continues in your ${genre} adventure. The consequences of your previous choice unfold before you, presenting new challenges and opportunities.\n\nWhat will you do next?`,
        hooks: [
          "Take a bold action to advance the plot",
          "Gather more information before proceeding",
          "Work together to overcome the current challenge"
        ],
        memory_summary: `Turn ${turnIndex} continuation of ${campaignTitle}`
      };
    }

    const characterDescriptions = characters.map(char => 
      `${char.name} (${char.archetype})`
    ).join(', ');

    const previousContext = previousTurns.map(turn => 
      `Turn ${turn.turn_index}: ${turn.summary}`
    ).join('\n');

    const prompt = `You are a master storyteller continuing a ${genre} story. Generate the next scene based on the previous events and the players' choice.

Campaign: ${campaignTitle}
Genre: ${genre}
Characters: ${characterDescriptions}
Turn: ${turnIndex}

Previous Events:
${previousContext}

Players chose: ${selectedHook}

Create:
1. A compelling scene that follows from the players' choice (2-3 paragraphs)
2. Three new story hooks that build on the current situation and offer meaningful choices

The story should:
- Naturally follow from the previous choice
- Maintain the ${genre} tone and atmosphere
- Incorporate all characters appropriately
- Create new challenges or opportunities
- Keep the narrative engaging and dynamic

Respond with a JSON object containing:
- content: the scene text
- hooks: array of 3 new story hook options
- memory_summary: a brief summary for the AI's memory of this scene`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const parsed = JSON.parse(response);
      return {
        content: parsed.content,
        hooks: parsed.hooks,
        memory_summary: parsed.memory_summary
      };
    } catch (error) {
      console.error('Error in AI story continuation:', error);
      // Fallback content
      return {
        content: `The story continues in your ${genre} adventure. The consequences of your previous choice unfold before you, presenting new challenges and opportunities.\n\nWhat will you do next?`,
        hooks: [
          "Take a bold action to advance the plot",
          "Gather more information before proceeding",
          "Work together to overcome the current challenge"
        ],
        memory_summary: `Turn ${turnIndex} continuation of ${campaignTitle}`
      };
    }
  }
}
