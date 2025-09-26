"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Campaign, Turn, Resolution, Character, Vote } from "../../types";

export default function CampaignPlay() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedHook, setSelectedHook] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

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

  // Fetch current turn
  const fetchTurn = async () => {
    try {
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}/turn`);
      if (response.ok) {
        const turnData = await response.json();
        setTurn(turnData);
        
        // Fetch resolution for this turn
        const resolutionResponse = await fetch(`http://localhost:4000/turns/${turnData.id}/resolution`);
        if (resolutionResponse.ok) {
          const resolutionData = await resolutionResponse.json();
          setResolution(resolutionData);
        }
      }
    } catch (error) {
      console.error('Error fetching turn:', error);
    }
  };

  // Fetch characters
  const fetchCharacters = async () => {
    try {
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}/characters`);
      if (response.ok) {
        const charactersData = await response.json();
        setCharacters(charactersData);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  // Fetch votes
  const fetchVotes = async () => {
    if (!turn) return;
    
    try {
      const response = await fetch(`http://localhost:4000/turns/${turn.id}/votes`);
      if (response.ok) {
        const votesData = await response.json();
        setVotes(votesData);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchTurn();
      fetchCharacters();
    }
  }, [campaignId]);

  useEffect(() => {
    if (turn) {
      fetchVotes();
      
      // Calculate time left
      const endTime = new Date(turn.ends_at).getTime();
      const now = new Date().getTime();
      const timeLeftMs = Math.max(0, endTime - now);
      setTimeLeft(Math.ceil(timeLeftMs / 1000));
      
      // Update countdown every second
      const interval = setInterval(() => {
        const newTimeLeft = Math.max(0, Math.ceil((endTime - new Date().getTime()) / 1000));
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [turn]);

  const handleVote = async (hookIndex: number) => {
    if (!turn || !characters.length) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnId: turn.id,
          characterId: characters[0].id, // Use first character for now
          hookIndex: hookIndex
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }

      setSelectedHook(hookIndex);
      await fetchVotes(); // Refresh votes
    } catch (error) {
      alert('Error voting: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!campaign || !turn || !resolution) {
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
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href={`/campaigns/${campaignId}/characters`} style={{ textDecoration: "none", color: "#ffffff", opacity: 0.7 }}>
            ← Back to Characters
          </Link>
          <h1 style={{
            fontSize: 48,
            fontWeight: 400,
            fontFamily: "serif",
            color: "#f5f5f5",
            margin: "20px 0"
          }}>
            {campaign.title}
          </h1>
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: 8,
            padding: "12px 20px",
            display: "inline-block",
            marginBottom: 20
          }}>
            <span style={{ fontSize: 14, opacity: 0.7, marginRight: 8 }}>Turn {turn.turn_index}</span>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#4ade80"
            }}>
              {formatTime(timeLeft)} remaining
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
              justifyContent: "center"
            }}>
              <span style={{ fontSize: 14, opacity: 0.7, whiteSpace: "nowrap" }}>
                Campaign Code:
              </span>
              <span style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#4ade80",
                fontFamily: "monospace",
                letterSpacing: "2px",
                background: "rgba(74, 222, 128, 0.1)",
                padding: "6px 12px",
                borderRadius: 6,
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
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 10,
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
        </div>

        {/* Scene Content */}
        <div style={{
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: 16,
          padding: 32,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          marginBottom: 32
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20, color: "#ffffff" }}>
            Current Scene
          </h2>
          <div style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "#e0e0e0",
            whiteSpace: "pre-wrap"
          }}>
            {resolution.content}
          </div>
        </div>

        {/* Hook Choices */}
        <div style={{
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: 16,
          padding: 32,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          marginBottom: 32
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20, color: "#ffffff" }}>
            What do you choose?
          </h2>
          
          {selectedHook !== null ? (
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: "rgba(74, 222, 128, 0.1)",
              border: "1px solid #4ade80",
              marginBottom: 20
            }}>
              <p style={{ margin: 0, color: "#4ade80", fontWeight: 600 }}>
                ✓ You voted: <strong>{resolution.hooks[selectedHook]}</strong>
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {resolution.hooks.map((hook, index) => (
                <button
                  key={index}
                  onClick={() => handleVote(index)}
                  disabled={loading}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 8,
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#ffffff",
                    fontSize: 16,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.borderColor = "#4ade80";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }
                  }}
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong> {hook}
                </button>
              ))}
            </div>
          )}
          
          {loading && <p style={{ opacity: 0.7, marginTop: 16 }}>Submitting your vote...</p>}
        </div>

        {/* Vote Results */}
        {votes.length > 0 && (
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: 16,
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20, color: "#ffffff" }}>
              Vote Results
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {votes.map((vote) => (
                <div
                  key={vote.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(45deg, #4ade80, #22c55e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#000000"
                  }}>
                    {vote.characters?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>
                      {vote.characters?.name} ({vote.characters?.archetype})
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, color: "#cccccc" }}>
                      Voted: {resolution.hooks[vote.hook_index]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
