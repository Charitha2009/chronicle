"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Player, Room, Character } from "../../types";

export default function Lobby() {
  const [roomCode, setRoomCode] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const createRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    
    try {
      // Create a campaign instead of a room
      const response = await fetch('http://localhost:4000/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: `Adventure Room ${Date.now()}`, 
          genre: 'fantasy', // Default genre, will be changed in story selection
          maxPlayers: 6
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }
      
      const { campaign } = await response.json();
      setRoom({ id: campaign.id, name: campaign.title, created_at: campaign.created_at });
      setCreatedRoomCode(campaign.id);
      setIsInRoom(true);
      setIsRoomCreator(true);
      
      // Create a host character
      const characterResponse = await fetch('http://localhost:4000/characters/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          name: playerName.trim(),
          archetype: 'Host'
        })
      });
      
      if (characterResponse.ok) {
        const character = await characterResponse.json();
        setCurrentPlayer({
          id: character.id,
          user_id: character.user_id,
          room_id: character.campaign_id,
          display_name: character.name,
          created_at: character.created_at
        });
        setPlayers([{
          id: character.id,
          user_id: character.user_id,
          room_id: character.campaign_id,
          display_name: character.name,
          created_at: character.created_at
        }]);
        
        // Move campaign to character selection status
        const enterResponse = await fetch(`http://localhost:4000/campaigns/${campaign.id}/enter-character-select`, {
          method: 'POST'
        });
        
        if (enterResponse.ok) {
          // Redirect host to character selection
          window.location.href = `/campaigns/${campaign.id}/characters`;
        }
      }
    } catch (error) {
      alert('Error creating room: ' + (error as Error).message);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!roomCode.trim()) {
      alert("Please enter a room code");
      return;
    }
    
    try {
      // Check if campaign exists
      const campaignResponse = await fetch(`http://localhost:4000/campaigns/${roomCode.trim()}`);
      if (!campaignResponse.ok) {
        throw new Error('Campaign not found');
      }
      
      const campaign = await campaignResponse.json();
      setRoom({ id: campaign.id, name: campaign.title, created_at: campaign.created_at });
      setCreatedRoomCode(campaign.id);
      setIsInRoom(true);
      setIsRoomCreator(false);
      
      // Always create a character for the joining player, regardless of campaign status
      const characterResponse = await fetch('http://localhost:4000/characters/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          name: playerName.trim(),
          archetype: 'Guest'
        })
      });
      
      if (characterResponse.ok) {
        const character = await characterResponse.json();
        setCurrentPlayer({
          id: character.id,
          user_id: character.user_id,
          room_id: character.campaign_id,
          display_name: character.name,
          created_at: character.created_at
        });
        
        // Fetch all characters in the campaign
        await fetchPlayers(campaign.id);
        
        // Handle different campaign statuses
        if (campaign.status === 'character_select' || campaign.status === 'active') {
          alert(`Joining campaign "${campaign.title}" - redirecting to character selection...`);
        }
        
        // Always redirect to character selection
        window.location.href = `/campaigns/${campaign.id}/characters`;
      }
    } catch (error) {
      alert('Error joining room: ' + (error as Error).message);
    }
  };

  const fetchPlayers = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}/characters`);
      if (response.ok) {
        const charactersData = await response.json();
        // Convert characters to players format for compatibility
        const playersData = charactersData.map((char: Character) => ({
          id: char.id,
          user_id: char.user_id,
          room_id: char.campaign_id,
          display_name: char.name,
          created_at: char.created_at
        }));
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const startGame = () => {
    window.location.href = `/story-selection?room=${createdRoomCode || roomCode}`;
  };

  // Real-time character updates
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`campaign:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `campaign_id=eq.${room.id}`
        },
        (payload) => {
          console.log('Character change:', payload);
          // Refresh players list when someone joins/leaves
          fetchPlayers(room.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  // Poll for player updates every 2 seconds as backup
  useEffect(() => {
    if (!room) return;

    const interval = setInterval(() => {
      fetchPlayers(room.id);
    }, 2000);

    return () => clearInterval(interval);
  }, [room]);

  if (!isInRoom) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#0a0a0a",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ maxWidth: 600, width: "100%", padding: "40px" }}>
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
            <p style={{ fontSize: 18, opacity: 0.8 }}>
              Create or join a room to start your adventure
            </p>
          </div>

          {/* Player Name Input */}
          <div style={{ marginBottom: 40 }}>
            <label style={{ display: "block", marginBottom: 12, fontSize: 16, fontWeight: 500 }}>
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                fontSize: 16,
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Create Room */}
          <div style={{ 
            background: "rgba(255, 255, 255, 0.05)", 
            borderRadius: 16, 
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: 24
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#ffffff" }}>
              Create Room
            </h2>
            <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
              Start a new adventure and invite friends
            </p>
            <button
              onClick={createRoom}
              style={{
                width: "100%",
                padding: "16px 24px",
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
              Create Room
            </button>
          </div>

          {/* Join Room */}
          <div style={{ 
            background: "rgba(255, 255, 255, 0.05)", 
            borderRadius: 16, 
            padding: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#ffffff" }}>
              Join Room
            </h2>
            <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
              Enter a room code to join an existing adventure
            </p>
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character room code..."
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  fontSize: 16,
                  textAlign: "center",
                  letterSpacing: "2px",
                  fontWeight: 600,
                  boxSizing: "border-box"
                }}
              />
            </div>
            <button
              onClick={joinRoom}
              style={{
                width: "100%",
                padding: "16px 24px",
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
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Room view - showing players and ready button
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0a0a0a",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ maxWidth: 600, width: "100%", padding: "40px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#ffffff" }}>
            <h1 style={{ 
              fontSize: 36, 
              fontWeight: 400, 
              fontFamily: "serif",
              color: "#f5f5f5",
              margin: 0,
              marginBottom: 16
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
              {createdRoomCode || roomCode}
            </span>
          </div>
          <p style={{ fontSize: 16, opacity: 0.8 }}>
            {isRoomCreator ? "Share this code with friends" : "Waiting for the host to start..."}
          </p>
        </div>

        {/* Players List */}
        <div style={{ 
          background: "rgba(255, 255, 255, 0.05)", 
          borderRadius: 16, 
          padding: 32,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          marginBottom: 32
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20, color: "#ffffff" }}>
            Players ({players.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {players.map((player, index) => (
              <div
                key={player.id}
                style={{
                  padding: "16px 20px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, #4ade80, #22c55e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#000000"
                }}>
                  {player.display_name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{player.display_name}</span>
                {index === 0 && (
                  <span style={{ 
                    fontSize: 12, 
                    background: "rgba(74, 222, 128, 0.2)", 
                    color: "#4ade80",
                    padding: "4px 8px",
                    borderRadius: 4,
                    marginLeft: "auto"
                  }}>
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Message */}
        <div style={{
          padding: "20px 32px",
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
          marginTop: 32
        }}>
          <p style={{ margin: 0, fontSize: 16, opacity: 0.8 }}>
            {isRoomCreator 
              ? "You are the host. Players can join using the room code above." 
              : "Waiting for the host to start the adventure..."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
