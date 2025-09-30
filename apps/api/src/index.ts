import express from "express";
import cors from "cors";
import pino from "pino";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { AIService } from "./ai-service";

dotenv.config();
const log = pino({ transport: { target: "pino-pretty" } });

const app = express();
app.use(cors());
app.use(express.json());

// Supabase service client (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Types
type CampaignStatus = 'lobby' | 'character_select' | 'starting' | 'active' | 'ended';
type Genre = 'dark_fantasy' | 'space_opera' | 'mystery' | 'post_apoc' | 'pirate' | 'fantasy' | 'scifi' | 'horror' | 'adventure' | 'romance';

// Generate a short campaign code
function generateCampaignCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Test endpoint
app.get("/test", (_req, res) => res.json({ message: "Test endpoint works" }));

app.get("/", (_req, res) => {
  res.type("text").send("Chronicle Campaign API 🚀 Try GET /health, POST /campaigns");
});

// AI-Powered Genre Selection
app.post("/campaigns/:id/suggest-genre", async (req, res) => {
  const { id } = req.params;

  try {
    // Get characters for this campaign
    const { data: characters, error: charsError } = await supabase
      .from("characters")
      .select("id, name, archetype, avatar_url")
      .eq("campaign_id", id)
      .eq("is_locked", true);

    if (charsError) return res.status(400).json({ error: charsError.message });
    if (!characters || characters.length === 0) {
      return res.status(400).json({ error: "No locked characters found for genre suggestion" });
    }

    // Use AI to suggest genre
    const suggestion = await AIService.suggestGenre(characters);
    
    res.json(suggestion);
  } catch (error) {
    console.error('Error in genre suggestion:', error);
    res.status(500).json({ error: "Failed to generate genre suggestion" });
  }
});

// AI-Powered Story Generation
app.post("/campaigns/:id/generate-story", async (req, res) => {
  const { id } = req.params;
  const { genre, turnIndex = 1, selectedHook } = req.body;

  try {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (campaignError || !campaign) {
      return res.status(400).json({ error: "Campaign not found" });
    }

    // Get characters
    const { data: characters, error: charsError } = await supabase
      .from("characters")
      .select("id, name, archetype, avatar_url")
      .eq("campaign_id", id)
      .eq("is_locked", true);

    if (charsError) return res.status(400).json({ error: charsError.message });
    if (!characters || characters.length === 0) {
      return res.status(400).json({ error: "No locked characters found" });
    }

    let storyContent;
    
    if (turnIndex === 1) {
      // Generate opening scene
      storyContent = await AIService.generateStoryContent(
        characters, 
        genre || campaign.genre, 
        campaign.title, 
        turnIndex
      );
    } else {
      // Generate story continuation
      const { data: previousTurns } = await supabase
        .from("turns")
        .select("*")
        .eq("campaign_id", id)
        .lt("turn_index", turnIndex)
        .order("turn_index", { ascending: true });

      storyContent = await AIService.generateStoryContinuation(
        characters,
        genre || campaign.genre,
        campaign.title,
        previousTurns || [],
        selectedHook || "",
        turnIndex
      );
    }

    res.json(storyContent);
  } catch (error) {
    console.error('Error in story generation:', error);
    res.status(500).json({ error: "Failed to generate story content" });
  }
});

// 2.1 Create campaign (Host picks genre)
app.post("/campaigns", async (req, res) => {
  const { title, genre, maxPlayers } = req.body ?? {};
  
  if (!title || !genre) {
    return res.status(400).json({ error: "Title and genre are required" });
  }

  // Generate a unique 6-character campaign code
  let campaignCode;
  let attempts = 0;
  do {
    campaignCode = generateCampaignCode();
    attempts++;
    
    // Check if this code already exists
    const { data: existingCampaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignCode)
      .single();
    
    if (!existingCampaign || attempts > 10) break;
  } while (attempts <= 10);

  // Create campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      id: campaignCode,
      title,
      genre,
      max_players: maxPlayers,
      host_user_id: crypto.randomUUID(), // Temporary for now
      status: 'lobby'
    })
    .select()
    .single();

  if (campaignError) return res.status(400).json({ error: campaignError.message });

  res.json({
    campaignId: campaign.id,
    campaign: campaign
  });
});

// Get campaign details
app.get("/campaigns/:id", async (req, res) => {
  const { id } = req.params;

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Campaign not found" });

  res.json(campaign);
});

// 2.2 Move to character selection
app.post("/campaigns/:id/enter-character-select", async (req, res) => {
  const { id } = req.params;

  // Check if campaign exists and is in lobby status
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("status", "lobby")
    .single();

  if (campaignError || !campaign) {
    return res.status(400).json({ error: "Campaign not found or not in lobby status" });
  }

  // Update status to character_select
  const { data: updatedCampaign, error: updateError } = await supabase
    .from("campaigns")
    .update({ status: 'character_select', updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return res.status(400).json({ error: updateError.message });

  res.json(updatedCampaign);
});

// 2.3 List characters
app.get("/campaigns/:id/characters", async (req, res) => {
  const { id } = req.params;

  const { data: characters, error } = await supabase
    .from("characters")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  res.json(characters);
});

// Claim/create character
app.post("/characters/claim", async (req, res) => {
  const { campaignId, name, archetype, avatarUrl } = req.body ?? {};
  
  if (!campaignId || !name || !archetype) {
    return res.status(400).json({ error: "Campaign ID, name, and archetype are required" });
  }

  // Check if name already exists in campaign
  const { data: existingCharacter } = await supabase
    .from("characters")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("name", name)
    .single();

  if (existingCharacter) {
    return res.status(400).json({ error: "Character name already taken" });
  }

  const { data: character, error } = await supabase
    .from("characters")
    .insert({
      campaign_id: campaignId,
      user_id: crypto.randomUUID(), // Temporary for now
      name,
      archetype,
      avatar_url: avatarUrl,
      is_locked: false
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(character);
});

// Update character
app.patch("/characters/:id", async (req, res) => {
  const { id } = req.params;
  const { name, archetype, avatarUrl } = req.body ?? {};

  const { data: character, error } = await supabase
    .from("characters")
    .update({
      name,
      archetype,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("is_locked", false) // Only allow updates to unlocked characters
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(character);
});

// Lock character
app.post("/characters/:id/lock", async (req, res) => {
  const { id } = req.params;

  // First check if character exists
  const { data: existingCharacters, error: checkError } = await supabase
    .from("characters")
    .select("id, is_locked")
    .eq("id", id);

  if (checkError || !existingCharacters || existingCharacters.length === 0) {
    return res.status(404).json({ error: "Character not found" });
  }

  const existingCharacter = existingCharacters[0];

  if (existingCharacter.is_locked) {
    return res.status(400).json({ error: "Character is already locked" });
  }

  const { data: characters, error } = await supabase
    .from("characters")
    .update({ 
      is_locked: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!characters || characters.length === 0) {
    return res.status(404).json({ error: "Character not found" });
  }

  res.json(characters[0]);
});

// 2.4 Host starts story (seed Turn 1)
app.post("/campaigns/:id/start", async (req, res) => {
  const { id } = req.params;

  // Check if campaign exists and is in character_select status
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("status", "character_select")
    .single();

  if (campaignError || !campaign) {
    return res.status(400).json({ error: "Campaign not found or not in character selection status" });
  }

  // Check if at least one character is locked
  const { data: lockedCharacters, error: charsError } = await supabase
    .from("characters")
    .select("id")
    .eq("campaign_id", id)
    .eq("is_locked", true);

  if (charsError) return res.status(400).json({ error: charsError.message });
  if (!lockedCharacters || lockedCharacters.length === 0) {
    return res.status(400).json({ error: "At least one character must be locked before starting" });
  }

  // Update campaign status to starting
  const { error: updateError } = await supabase
    .from("campaigns")
    .update({ 
      status: 'starting',
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (updateError) return res.status(400).json({ error: updateError.message });

  // Create Turn 1
  const turnStartsAt = new Date();
  const turnEndsAt = new Date(turnStartsAt.getTime() + 60 * 1000); // 60 seconds

  const { data: turn, error: turnError } = await supabase
    .from("turns")
    .insert({
      campaign_id: id,
      turn_index: 1,
      starts_at: turnStartsAt.toISOString(),
      ends_at: turnEndsAt.toISOString(),
      summary: "Opening scene generation"
    })
    .select()
    .single();

  if (turnError) return res.status(400).json({ error: turnError.message });

  // Get characters for AI story generation
  const { data: characters, error: charactersError } = await supabase
    .from("characters")
    .select("id, name, archetype, avatar_url")
    .eq("campaign_id", id)
    .eq("is_locked", true);

  if (charactersError) return res.status(400).json({ error: charactersError.message });
  if (!characters || characters.length === 0) {
    return res.status(400).json({ error: "No locked characters found" });
  }

  // Generate AI-powered opening scene
  let openingContent, hooks, memorySummary;
  
  try {
    const storyContent = await AIService.generateStoryContent(
      characters, 
      campaign.genre, 
      campaign.title, 
      1
    );
    openingContent = storyContent.content;
    hooks = storyContent.hooks;
    memorySummary = storyContent.memory_summary;
  } catch (aiError) {
    console.error('AI story generation failed, using fallback:', aiError);
    // Fallback content
    openingContent = `Welcome to your ${campaign.genre} adventure: ${campaign.title}!

You find yourself at the beginning of an epic journey. The world around you is filled with possibilities and danger lurks in every shadow. Your choices will shape the destiny of this tale.

What will you do next?`;

    hooks = [
      "Investigate the mysterious light in the distance",
      "Seek shelter and plan your next move", 
      "Call out to see if anyone else is nearby"
    ];
    memorySummary = `Opening scene of ${campaign.title} - players begin their ${campaign.genre} adventure`;
  }

  // Create resolution for Turn 1
  const { data: resolution, error: resolutionError } = await supabase
    .from("resolutions")
    .insert({
      turn_id: turn.id,
      content: openingContent,
      hooks: hooks,
      memory_summary: memorySummary
    })
    .select()
    .single();

  if (resolutionError) return res.status(400).json({ error: resolutionError.message });

  // Initialize world state
  const { error: worldStateError } = await supabase
    .from("world_state")
    .insert({
      campaign_id: id,
      facts: { genre: campaign.genre, title: campaign.title, turn: 1 }
    });

  if (worldStateError) return res.status(400).json({ error: worldStateError.message });

  // Update campaign status to active
  const { error: finalUpdateError } = await supabase
    .from("campaigns")
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (finalUpdateError) return res.status(400).json({ error: finalUpdateError.message });

  res.json({ 
    turnId: turn.id,
    turn: turn,
    resolution: resolution,
    message: "Campaign started successfully!"
  });
});

// Get current turn for campaign
app.get("/campaigns/:id/turn", async (req, res) => {
  const { id } = req.params;

  const { data: turn, error: turnError } = await supabase
    .from("turns")
    .select("*")
    .eq("campaign_id", id)
    .order("turn_index", { ascending: false })
    .limit(1)
    .single();

  if (turnError) {
    if (turnError.code === "PGRST116") {
      return res.status(404).json({ error: "No turn found for this campaign" });
    }
    return res.status(400).json({ error: turnError.message });
  }

  res.json(turn);
});

// Get resolution for turn
app.get("/turns/:turnId/resolution", async (req, res) => {
  const { turnId } = req.params;

  const { data: resolution, error } = await supabase
    .from("resolutions")
    .select("*")
    .eq("turn_id", turnId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "No resolution found for this turn" });
    }
    return res.status(400).json({ error: error.message });
  }

  res.json(resolution);
});

// Submit action for turn
app.post("/actions", async (req, res) => {
  const { turnId, characterId, content } = req.body ?? {};

  if (!turnId || !characterId || !content) {
    return res.status(400).json({ error: "Turn ID, character ID, and content are required" });
  }

  const { data: action, error } = await supabase
    .from("actions")
    .insert({
      turn_id: turnId,
      character_id: characterId,
      content: content
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(action);
});

// Vote on hook
app.post("/votes", async (req, res) => {
  const { turnId, characterId, hookIndex } = req.body ?? {};

  if (!turnId || !characterId || hookIndex === undefined) {
    return res.status(400).json({ error: "Turn ID, character ID, and hook index are required" });
  }

  // Upsert vote (replace existing vote for this character in this turn)
  const { data: vote, error } = await supabase
    .from("votes")
    .upsert({
      turn_id: turnId,
      character_id: characterId,
      hook_index: hookIndex
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(vote);
});

// Get votes for turn
app.get("/turns/:turnId/votes", async (req, res) => {
  const { turnId } = req.params;

  const { data: votes, error } = await supabase
    .from("votes")
    .select(`
      *,
      characters (
        name,
        archetype
      )
    `)
    .eq("turn_id", turnId);

  if (error) return res.status(400).json({ error: error.message });

  res.json(votes);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  log.info(`Campaign API on http://localhost:${port}`);
});