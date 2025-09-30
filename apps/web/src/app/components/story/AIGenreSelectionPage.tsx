"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { StoryGenre } from "../../types";

interface GenreSuggestion {
  genre: string;
  confidence: number;
  reasoning: string;
}

export default function AIGenreSelection() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaignId");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<GenreSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  const storyGenres: StoryGenre[] = [
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
    },
    {
      id: "dark_fantasy",
      title: "Dark Fantasy",
      description: "Grim tales with magic and darkness",
      image: "⚔️",
      color: "#7c2d12"
    },
    {
      id: "space_opera",
      title: "Space Opera",
      description: "Epic space adventures and cosmic drama",
      image: "🌌",
      color: "#1e40af"
    },
    {
      id: "post_apoc",
      title: "Post-Apocalyptic",
      description: "Survival in a world after disaster",
      image: "☢️",
      color: "#92400e"
    },
    {
      id: "pirate",
      title: "Pirate",
      description: "High seas adventures and treasure hunting",
      image: "🏴‍☠️",
      color: "#059669"
    }
  ];

  const getAISuggestion = async () => {
    if (!campaignId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}/suggest-genre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to get AI suggestion');
      }

      const suggestion = await response.json();
      setAiSuggestion(suggestion);
      setShowAISuggestion(true);
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      alert('Failed to get AI genre suggestion. Please select manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const startStory = async () => {
    if (!selectedGenre) {
      alert("Please select a story genre");
      return;
    }
    
    try {
      // Update campaign with selected genre
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: selectedGenre,
          title: `${storyGenres.find(g => g.id === selectedGenre)?.title} Adventure`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update campaign');
      }

      // Navigate to character selection page
      window.location.href = `/campaigns/${campaignId}/characters`;
    } catch (error) {
      alert('Error updating campaign: ' + (error as Error).message);
    }
  };

  const acceptAISuggestion = () => {
    if (aiSuggestion) {
      setSelectedGenre(aiSuggestion.genre);
      setShowAISuggestion(false);
    }
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
            <span style={{ fontSize: 14, opacity: 0.7, marginRight: 8 }}>Campaign:</span>
            <span style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              letterSpacing: "3px",
              color: "#4ade80"
            }}>
              {campaignId}
            </span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 16, color: "#e0e0e0" }}>
            Choose Your Adventure
          </h2>
          <p style={{ fontSize: 18, opacity: 0.8 }}>
            Select a story genre or let AI suggest the perfect one based on your characters
          </p>
        </div>

        {/* AI Suggestion Section */}
        {!showAISuggestion && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <button
              onClick={getAISuggestion}
              disabled={isLoading}
              style={{
                padding: "16px 32px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(45deg, #3b82f6, #1d4ed8)",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                opacity: isLoading ? 0.7 : 1,
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
              }}
            >
              {isLoading ? "🤖 AI is analyzing..." : "🤖 Get AI Genre Suggestion"}
            </button>
            <p style={{ fontSize: 14, opacity: 0.6, marginTop: 12 }}>
              AI will analyze your characters and suggest the best genre
            </p>
          </div>
        )}

        {/* AI Suggestion Display */}
        {showAISuggestion && aiSuggestion && (
          <div style={{
            background: "rgba(59, 130, 246, 0.1)",
            border: "2px solid #3b82f6",
            borderRadius: 16,
            padding: 24,
            marginBottom: 40,
            textAlign: "center"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: "#3b82f6" }}>
              AI Suggestion
            </h3>
            <p style={{ fontSize: 18, marginBottom: 16, color: "#e0e0e0" }}>
              Based on your characters, we suggest: <strong>{storyGenres.find(g => g.id === aiSuggestion.genre)?.title}</strong>
            </p>
            <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20, fontStyle: "italic" }}>
              "{aiSuggestion.reasoning}"
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button
                onClick={acceptAISuggestion}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(45deg, #4ade80, #22c55e)",
                  color: "#000000",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Accept Suggestion
              </button>
              <button
                onClick={() => setShowAISuggestion(false)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: "transparent",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Choose Manually
              </button>
            </div>
          </div>
        )}

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
