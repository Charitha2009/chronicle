"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function StorySelection() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");
  const [selectedGenre, setSelectedGenre] = useState("");

  const storyGenres = [
    {
      id: "fantasy",
      title: "Fantasy",
      description: "Magic, dragons, and mystical realms",
      image: "🏰",
      color: "#8b5cf6"
    },
    {
      id: "scifi",
      title: "Sci-Fi",
      description: "Space exploration and futuristic technology",
      image: "🚀",
      color: "#06b6d4"
    },
    {
      id: "horror",
      title: "Horror",
      description: "Dark mysteries and supernatural thrills",
      image: "👻",
      color: "#dc2626"
    },
    {
      id: "mystery",
      title: "Mystery",
      description: "Crime solving and detective work",
      image: "🔍",
      color: "#f59e0b"
    },
    {
      id: "adventure",
      title: "Adventure",
      description: "Epic quests and daring expeditions",
      image: "🗺️",
      color: "#10b981"
    },
    {
      id: "romance",
      title: "Romance",
      description: "Love stories and emotional journeys",
      image: "💕",
      color: "#ec4899"
    }
  ];

  const startStory = () => {
    if (!selectedGenre) {
      alert("Please select a story genre");
      return;
    }
    // Redirect to the room with the selected genre
    window.location.href = `/room/${roomCode}?genre=${selectedGenre}`;
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0a0a0a",
      color: "#ffffff",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#ffffff" }}>
            <h1 style={{ 
              fontSize: 48, 
              fontWeight: 400, 
              fontFamily: "serif",
              color: "#f5f5f5",
              margin: 0,
              marginBottom: 20
            }}>
              Chronicle
            </h1>
          </Link>
          <div style={{ 
            background: "rgba(255, 255, 255, 0.1)", 
            borderRadius: 8, 
            padding: "12px 20px",
            display: "inline-block",
            marginBottom: 20
          }}>
            <span style={{ fontSize: 14, opacity: 0.7, marginRight: 8 }}>Room Code:</span>
            <span style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              letterSpacing: "3px",
              color: "#4ade80"
            }}>
              {roomCode}
            </span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 16, color: "#e0e0e0" }}>
            Choose Your Adventure
          </h2>
          <p style={{ fontSize: 18, opacity: 0.8 }}>
            Select a story genre to begin your collaborative tale
          </p>
        </div>

        {/* Story Genres Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: 24,
          marginBottom: 60
        }}>
          {storyGenres.map((genre) => (
            <div
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              style={{
                background: selectedGenre === genre.id 
                  ? `linear-gradient(135deg, ${genre.color}20, ${genre.color}10)` 
                  : "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 32,
                border: selectedGenre === genre.id 
                  ? `2px solid ${genre.color}` 
                  : "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (selectedGenre !== genre.id) {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedGenre !== genre.id) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }
              }}
            >
              {/* Selection indicator */}
              {selectedGenre === genre.id && (
                <div style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: genre.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#ffffff"
                }}>
                  ✓
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <div style={{ 
                  fontSize: 64, 
                  marginBottom: 20,
                  filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))"
                }}>
                  {genre.image}
                </div>
                <h3 style={{ 
                  fontSize: 24, 
                  fontWeight: 600, 
                  marginBottom: 12, 
                  color: "#ffffff"
                }}>
                  {genre.title}
                </h3>
                <p style={{ 
                  fontSize: 16, 
                  opacity: 0.8, 
                  color: "#cccccc",
                  lineHeight: 1.5
                }}>
                  {genre.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={startStory}
            disabled={!selectedGenre}
            style={{
              padding: "20px 48px",
              borderRadius: 8,
              border: "none",
              background: selectedGenre 
                ? "linear-gradient(45deg, #4ade80, #22c55e)" 
                : "rgba(255, 255, 255, 0.1)",
              color: selectedGenre ? "#000000" : "rgba(255, 255, 255, 0.5)",
              fontSize: 20,
              fontWeight: 600,
              cursor: selectedGenre ? "pointer" : "not-allowed",
              transition: "all 0.3s ease",
              boxShadow: selectedGenre ? "0 4px 15px rgba(74, 222, 128, 0.3)" : "none"
            }}
            onMouseEnter={(e) => {
              if (selectedGenre) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(74, 222, 128, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedGenre) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(74, 222, 128, 0.3)";
              }
            }}
          >
            {selectedGenre ? `Start ${storyGenres.find(g => g.id === selectedGenre)?.title} Adventure` : "Select a Genre to Continue"}
          </button>
        </div>

        {/* Back Button */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link 
            href="/lobby"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              textDecoration: "none",
              fontSize: 16,
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
            }}
          >
            ← Back to Lobby
          </Link>
        </div>
      </div>
    </div>
  );
}
