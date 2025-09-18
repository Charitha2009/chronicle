"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Scene = {
  id: number;
  room_id: string;
  turn_number: number;
  content: string;
  created_at: string;
  room_name?: string;
};

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const [scene, setScene] = useState<Scene | null>(null);
  const [status, setStatus] = useState("Loading…");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL!;
    fetch(`${base}/rooms/${roomId}/scene`)
      .then((r) => r.json())
      .then((d) => {
        setScene(d);
        setStatus("");
      })
      .catch((e) => setStatus("Error: " + e.message));
  }, [roomId]);

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>← Back</a>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>
        Room {scene?.room_name ? `— ${scene.room_name}` : ""}
      </h1>
      {!scene && <p>{status}</p>}
      {scene && (
        <>
          <p style={{ opacity: 0.7 }}>
            Turn {scene.turn_number} • {new Date(scene.created_at).toLocaleString()}
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 10,
              background: "#fafafa",
            }}
          >
            {scene.content || "No scene yet. (We’ll add AI narration next.)"}
          </pre>
        </>
      )}
    </main>
  );
}