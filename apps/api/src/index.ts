import express from "express";
import cors from "cors";
import pino from "pino";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const log = pino({ transport: { target: "pino-pretty" } });

const app = express();
// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Supabase service client (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Test endpoint
app.get("/test", (_req, res) => res.json({ message: "Test endpoint works" }));

app.get("/", (_req, res) => {
    res.type("text").send("Chronicle API 🚀 Try GET /health, GET /rooms, POST /rooms");
  });
  
  // List latest rooms
  app.get("/rooms", async (_req, res) => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });
  
// Example: create a room
app.post("/rooms", async (req, res) => {
  const { name } = req.body ?? {};
  const { data, error } = await supabase
    .from("rooms")
    .insert({ name })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Generate a short room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create room with code
app.post("/rooms/create", async (req, res) => {
  const { name, playerName } = req.body ?? {};
  if (!name || !playerName) {
    return res.status(400).json({ error: "Room name and player name are required" });
  }

  // Generate a unique 6-character room code
  let roomCode;
  let attempts = 0;
  do {
    roomCode = generateRoomCode();
    attempts++;
    
    // Check if this code already exists
    const { data: existingRoom } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", roomCode)
      .single();
    
    if (!existingRoom || attempts > 10) break; // Stop after 10 attempts
  } while (attempts <= 10);

  const { data, error } = await supabase
    .from("rooms")
    .insert({ id: roomCode, name })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  
  // Create the host player
  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({ 
      user_id: crypto.randomUUID(), // Generate proper UUID for lobby user
      room_id: data.id, 
      display_name: playerName 
    })
    .select()
    .single();
    
  if (playerError) return res.status(400).json({ error: playerError.message });
  
  res.json({ room: data, player });
});

// Join room with code
app.post("/rooms/join", async (req, res) => {
  const { roomCode, playerName } = req.body ?? {};
  if (!roomCode || !playerName) {
    return res.status(400).json({ error: "Room code and player name are required" });
  }
  
  // Find room by ID (assuming roomCode is the room ID)
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomCode)
    .single();
    
  if (roomError || !room) {
    return res.status(404).json({ error: "Room not found" });
  }
  
  // Check if player already exists in this room
  const { data: existingPlayer } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", room.id)
    .eq("display_name", playerName)
    .single();
    
  if (existingPlayer) {
    return res.json({ room, player: existingPlayer });
  }
  
  // Create new player
  const { data: player, error: playerError } = await supabase
    .from("players")
    .insert({ 
      user_id: crypto.randomUUID(), // Generate proper UUID for lobby user
      room_id: room.id, 
      display_name: playerName 
    })
    .select()
    .single();
    
  if (playerError) return res.status(400).json({ error: playerError.message });
  
  res.json({ room, player });
});

// Get room players
app.get("/rooms/:roomId/players", async (req, res) => {
  const { roomId } = req.params;
  
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(players);
});

// Example: get the latest scene in a room
app.get("/rooms/:roomId/scene", async (req, res) => {
  const { roomId } = req.params;
  const { data, error } = await supabase
    .from("scenes_view") // we'll create view later
    .select("*")
    .eq("room_id", roomId)
    .order("turn_number", { ascending: false })
    .limit(1)
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create/join player in a room
app.post("/players", async (req, res) => {
  const { room_id, display_name } = req.body ?? {};
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  
  if (!room_id || !display_name) {
    return res.status(400).json({ error: "Missing room_id or display_name" });
  }

  // Create a Supabase client with the user's access token
  const userSupabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { 
        headers: { 
          Authorization: authHeader 
        } 
      }
    }
  );

  // Get the authenticated user
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Insert the player record
  const { data, error } = await supabase
    .from("players")
    .insert({ 
      user_id: user.id, 
      room_id, 
      display_name 
    })
    .select()
    .single();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create a new scene (server-only, uses service key)
app.post("/rooms/:roomId/scenes", async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body ?? {};
  
  if (!content) {
    return res.status(400).json({ error: "Missing content" });
  }

  // Get the current turn number for this room
  const { data: latestScene, error: latestError } = await supabase
    .from("scenes")
    .select("turn_number")
    .eq("room_id", roomId)
    .order("turn_number", { ascending: false })
    .limit(1)
    .single();

  const turnNumber = latestScene ? latestScene.turn_number + 1 : 1;

  // Insert the new scene
  const { data, error } = await supabase
    .from("scenes")
    .insert({
      room_id: roomId,
      turn_number: turnNumber,
      content: content
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get choices for a scene
app.get("/scenes/:sceneId/choices", async (req, res) => {
  const { sceneId } = req.params;
  
  const { data, error } = await supabase
    .from("choices")
    .select("*")
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: true });
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Add choices to a scene (server-only)
app.post("/scenes/:sceneId/choices", async (req, res) => {
  const { sceneId } = req.params;
  const { choices } = req.body ?? {};
  
  if (!choices || !Array.isArray(choices)) {
    return res.status(400).json({ error: "Missing or invalid choices array" });
  }

  const choiceRecords = choices.map((choice: string, index: number) => ({
    scene_id: sceneId,
    text: choice,
    choice_letter: String.fromCharCode(65 + index) // A, B, C, etc.
  }));

  const { data, error } = await supabase
    .from("choices")
    .insert(choiceRecords)
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get player's vote for a scene
app.get("/votes", async (req, res) => {
  const { scene_id, player_id } = req.query;
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  
  if (!scene_id || !player_id) {
    return res.status(400).json({ error: "Missing scene_id or player_id" });
  }

  // Create a Supabase client with the user's access token
  const userSupabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { 
        headers: { 
          Authorization: authHeader 
        } 
      }
    }
  );

  // Get the authenticated user
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Get the player's vote
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("scene_id", scene_id)
    .eq("player_id", player_id)
    .eq("user_id", user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return res.status(400).json({ error: error.message });
  }
  
  res.json(data || null);
});

// Vote on a choice
app.post("/votes", async (req, res) => {
  const { scene_id, player_id, choice_id } = req.body ?? {};
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  
  if (!scene_id || !player_id || !choice_id) {
    return res.status(400).json({ error: "Missing scene_id, player_id, or choice_id" });
  }

  // Create a Supabase client with the user's access token
  const userSupabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: { 
        headers: { 
          Authorization: authHeader 
        } 
      }
    }
  );

  // Get the authenticated user
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Verify the player belongs to the user
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", player_id)
    .eq("user_id", user.id)
    .single();

  if (playerError || !player) {
    return res.status(403).json({ error: "Player not found or access denied" });
  }

  // Upsert the vote (update existing or insert new)
  const { data, error } = await supabase
    .from("votes")
    .upsert({
      scene_id,
      player_id,
      choice_id,
      user_id: user.id
    }, {
      onConflict: 'scene_id,player_id'
    })
    .select()
    .single();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => log.info(`API on http://localhost:${PORT}`));