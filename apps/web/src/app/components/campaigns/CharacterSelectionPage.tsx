"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Character, Campaign } from "../../types";
import HostReadyButton from "./HostReadyButton";

export default function CharacterSelection() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [selectedArchetype, setSelectedArchetype] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedCharacters, setLockedCharacters] = useState(0);

  const archetypes = [
    "Warrior", "Mage", "Rogue", "Archer", "Guardian", "Healer", "Assassin", "Paladin", "Necromancer", "Bard"
  ];

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`http://localhost:4000/campaigns/${campaignId}`);
        if (response.ok) {
          const campaignData = await response.json();
          setCampaign(campaignData);
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      }
    };

    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  // Fetch characters
  const fetchCharacters = async () => {
    try {
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}/characters`);
      if (response.ok) {
        const charactersData = await response.json();
        setCharacters(charactersData);
        setLockedCharacters(charactersData.filter((c: Character) => c.is_locked).length);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCharacters();
    }
  }, [campaignId]);

  // Check if current user needs to create a character
  useEffect(() => {
    const checkUserCharacter = async () => {
      if (!campaignId || characters.length === 0 || !campaign) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userCharacter = characters.find(char => char.user_id === user.id);
          if (!userCharacter && campaign.status === 'character_select') {
            // User doesn't have a character in this campaign, show creation form
            setShowCharacterForm(true);
          }
        }
      } catch (error) {
        console.error('Error checking user character:', error);
      }
    };

    if (characters.length > 0 && campaign?.id) {
      checkUserCharacter();
    }
  }, [characters, campaign, campaignId]);

  // Real-time subscription to detect when campaign starts
  useEffect(() => {
    if (!campaignId || !campaign) return;

    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'campaigns',
        filter: `id=eq.${campaignId}`
      }, (payload) => {
        if (payload.new.status === 'active') {
          // Redirect all players to the story room
          window.location.href = `/campaigns/${campaignId}/play`;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, campaign]);

  const claimCharacter = async () => {
    if (!playerName.trim() || !selectedArchetype) {
      alert("Please enter your name and select an archetype");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/characters/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          name: playerName.trim(),
          archetype: selectedArchetype
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim character');
      }

      const character = await response.json();
      setCharacters([...characters, character]);
      setPlayerName("");
      setSelectedArchetype("");
    } catch (error) {
      alert('Error claiming character: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const lockCharacter = async (characterId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/characters/${characterId}/lock`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to lock character');
      }

      const updatedCharacter = await response.json();
      setCharacters(characters.map(c => 
        c.id === characterId ? { ...c, is_locked: true } : c
      ));
      setLockedCharacters(lockedCharacters + 1);
    } catch (error) {
      alert('Error locking character: ' + (error as Error).message);
    }
  };

  const startCampaign = async () => {
    try {
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}/start`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start campaign');
      }

      const result = await response.json();
      // Navigate to the campaign play page
      window.location.href = `/campaigns/${campaignId}/play`;
    } catch (error) {
      alert('Error starting campaign: ' + (error as Error).message);
    }
  };

  if (!campaign) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div>Loading campaign...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#ffffff",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/lobby" style={{ textDecoration: "none", color: "#ffffff", opacity: 0.7 }}>
            ← Back to Lobby
          </Link>
          <h1 style={{
            fontSize: 48,
            fontWeight: 400,
            fontFamily: "serif",
            color: "#f5f5f5",
            margin: "20px 0"
          }}>
            Character Selection
          </h1>
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
              color: "#4ade80"
            }}>
              {campaign.title}
            </span>
          </div>
          
          {/* Campaign Code Display */}
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: 12,
            padding: "16px 24px",
            display: "inline-block",
            marginBottom: 20,
            border: "2px solid rgba(74, 222, 128, 0.3)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center"
            }}>
              <span style={{ fontSize: 14, opacity: 0.7, whiteSpace: "nowrap" }}>
                Campaign Code:
              </span>
              <span style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#4ade80",
                fontFamily: "monospace",
                letterSpacing: "2px",
                background: "rgba(74, 222, 128, 0.1)",
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid rgba(74, 222, 128, 0.3)"
              }}>
                {campaignId}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(campaignId);
                  alert('Campaign code copied to clipboard!');
                }}
                style={{
                  background: "rgba(74, 222, 128, 0.2)",
                  border: "1px solid rgba(74, 222, 128, 0.5)",
                  color: "#4ade80",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(74, 222, 128, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(74, 222, 128, 0.2)";
                }}
              >
                Copy
              </button>
            </div>
          </div>
          
          <p style={{ fontSize: 16, opacity: 0.8 }}>
            {campaign.genre} • Max {campaign.max_players} players
          </p>
          
          {/* AI Genre Selection Button */}
          {characters.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Link 
                href={`/ai-genre-selection?campaignId=${campaignId}`}
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  borderRadius: 8,
                  background: "linear-gradient(45deg, #3b82f6, #1d4ed8)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.3)";
                }}
              >
                🤖 Get AI Genre Suggestion
              </Link>
              <p style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>
                Let AI analyze your characters and suggest the perfect genre
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          {/* Character Creation */}
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: 16,
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: "#ffffff" }}>
              Create Your Character
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Character Name
              </label>
              <input
                type="text"
                placeholder="Enter character name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: 16
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Archetype
              </label>
              <select
                value={selectedArchetype}
                onChange={(e) => setSelectedArchetype(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: 16
                }}
              >
                <option value="">Select an archetype</option>
                {archetypes.map(archetype => (
                  <option key={archetype} value={archetype}>{archetype}</option>
                ))}
              </select>
            </div>

            <button
              onClick={claimCharacter}
              disabled={loading || !playerName.trim() || !selectedArchetype}
              style={{
                width: "100%",
                padding: "16px 24px",
                borderRadius: 8,
                border: "none",
                background: loading || !playerName.trim() || !selectedArchetype
                  ? "rgba(255, 255, 255, 0.1)"
                  : "linear-gradient(45deg, #4ade80, #22c55e)",
                color: loading || !playerName.trim() || !selectedArchetype
                  ? "rgba(255, 255, 255, 0.5)"
                  : "#000000",
                fontSize: 16,
                fontWeight: 600,
                cursor: loading || !playerName.trim() || !selectedArchetype ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }}
            >
              {loading ? "Creating..." : "Claim Character"}
            </button>
          </div>

          {/* Character Roster */}
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: 16,
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: "#ffffff" }}>
              Character Roster ({characters.length})
            </h2>

            {characters.length === 0 ? (
              <p style={{ opacity: 0.7, textAlign: "center", padding: "40px 0" }}>
                No characters created yet
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {characters.map((character) => (
                  <div
                    key={character.id}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 8,
                      background: character.is_locked 
                        ? "rgba(74, 222, 128, 0.1)" 
                        : "rgba(255, 255, 255, 0.05)",
                      border: character.is_locked 
                        ? "1px solid #4ade80" 
                        : "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#ffffff" }}>
                        {character.name}
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.7, color: "#cccccc" }}>
                        {character.archetype}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {character.is_locked ? (
                        <span style={{
                          fontSize: 12,
                          background: "#4ade80",
                          color: "#000000",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontWeight: 600
                        }}>
                          LOCKED
                        </span>
                      ) : (
                        <button
                          onClick={() => lockCharacter(character.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 4,
                            border: "1px solid #4ade80",
                            background: "transparent",
                            color: "#4ade80",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#4ade80";
                            e.currentTarget.style.color = "#000000";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#4ade80";
                          }}
                        >
                          Lock In
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Host Ready Button */}
            <HostReadyButton
              campaign={campaign}
              campaignId={campaignId}
              lockedCharacters={lockedCharacters}
              totalPlayers={characters.length}
              onStartCampaign={startCampaign}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
