"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";

type Room = { id: string; name: string; created_at: string };

export default function Home() {
  const qc = useQueryClient();
  const [roomName, setRoomName] = useState("");

  // List rooms
  const { data: rooms, isLoading, isError, error } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => api<Room[]>("/rooms"),
  });

  // Create room
  const createRoom = useMutation({
    mutationFn: (name: string) =>
      api<Room>("/rooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      // navigate to the room page
      window.location.href = `/room/${room.id}`;
    },
  });

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Chronicle</h1>
      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        Create a room and jump in, or join an existing one.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!roomName.trim()) return;
          createRoom.mutate(roomName.trim());
        }}
        style={{ display: "flex", gap: 8, marginBottom: 24 }}
      >
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room name (e.g., Kaelthor Lobby)"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={createRoom.isPending}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
          }}
        >
          {createRoom.isPending ? "Creating..." : "Create"}
        </button>
      </form>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Recent Rooms</h2>
      {isLoading && <p>Loading rooms…</p>}
      {isError && <p style={{ color: "crimson" }}>Error: {(error as Error).message}</p>}
      <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
        {(rooms ?? []).map((r) => (
          <li key={r.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
              <Link href={`/room/${r.id}`} style={{ textDecoration: "underline" }}>
                Enter →
              </Link>
            </div>
          </li>
        ))}
        {rooms?.length === 0 && <li>No rooms yet—be the first!</li>}
      </ul>
    </main>
  );
}