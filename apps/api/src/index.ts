import express from "express";
import cors from "cors";
import pino from "pino";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const log = pino({ transport: { target: "pino-pretty" } });

const app = express();
app.use(cors({ origin: ["http://localhost:3000"] }));
app.use(express.json());

// Supabase service client (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

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

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => log.info(`API on http://localhost:${PORT}`));