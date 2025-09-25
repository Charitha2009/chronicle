"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import AuthWidget from "../components/AuthWidget";

type Room = { id: string; name: string; created_at: string };

export default function Home() {
  const qc = useQueryClient();
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");

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
      window.location.href = `/room/${room.id}`;
    },
  });

  // Join room
  const joinRoom = useMutation({
    mutationFn: (code: string) => {
      // For now, we'll search for rooms by name/id
      const room = rooms?.find(r => r.id === code || r.name.toLowerCase().includes(code.toLowerCase()));
      if (!room) throw new Error("Room not found");
      return Promise.resolve(room);
    },
    onSuccess: (room) => {
      window.location.href = `/room/${room.id}`;
    },
  });

  const adventureCards = [
    {
      title: "Whispers in the Highvale",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center"
    },
    {
      title: "A Vow at Dusk", 
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center"
    },
    {
      title: "The Grimoire Opens",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center"
    },
    {
      title: "Lanterns in Pines",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center"
    },
    {
      title: "Bastion of Stars",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center"
    }
  ];


  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0a0a0a",
      color: "#ffffff"
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "60px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 80 }}>
          <h1 style={{ 
            fontSize: 56, 
            fontWeight: 400, 
            fontFamily: "serif",
            color: "#f5f5f5",
            margin: 0,
            animation: "fadeInUp 1s ease-out"
          }}>
            Chronicle
          </h1>
        </div>

        {/* Main Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>
          {/* Left Panel - Hero Section */}
          <div>
            <h2 style={{ 
              fontSize: 36, 
              fontWeight: 300, 
              marginBottom: 32, 
              color: "#f5f5f5",
              lineHeight: 1.1,
              fontFamily: "serif"
            }}>
              Your Choices, Your Story, Your Legacy
            </h2>
            
            <p style={{ 
              fontSize: 18, 
              lineHeight: 1.6, 
              opacity: 0.9, 
              marginBottom: 48,
              color: "#e0e0e0",
              maxWidth: "90%"
            }}>
              Forge legends through natural conversation. Chronicle weaves worlds, remembers every decision, and adapts foes and fates to your playstyle—solo, with friends, or for your tabletop group.
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  window.location.href = '/lobby';
                }}
                style={{
                  padding: "18px 36px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  background: "transparent",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Start an Adventure
              </button>
            </div>
          </div>

          {/* Right Panel - Adventure Selection */}
          <div 
            data-adventure-panel
            style={{ 
              background: "transparent", 
              padding: 0
            }}
          >
            {/* Begin Journey Button */}
            <button
              onClick={() => {
                // Scroll to adventure cards
                const adventureCards = document.querySelector('[data-adventure-cards]');
                adventureCards?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                width: "100%",
                padding: "18px 24px",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.4)",
                background: "transparent",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginBottom: 40
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Begin the Journey
            </button>

            {/* Adventure Cards Grid */}
            <div 
              data-adventure-cards
              style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(2, 1fr)", 
                gap: 20
              }}
            >
              {adventureCards.map((adventure, index) => (
                <div
                  key={index}
                  style={{
                    background: "transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    aspectRatio: "1",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  onClick={() => {
                    setRoomName(adventure.title);
                    createRoom.mutate(adventure.title);
                  }}
                >
                  <img
                    src={adventure.image}
                    alt={adventure.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 8
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                    padding: "16px 12px 12px",
                    borderRadius: "0 0 8px 8px"
                  }}>
                    <h3 style={{ 
                      fontSize: 14, 
                      fontWeight: 500, 
                      color: "#ffffff",
                      margin: 0,
                      lineHeight: 1.2
                    }}>
                      {adventure.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}