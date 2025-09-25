"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Player = {
  id: number;
  user_id: string;
  room_id: string;
  display_name: string;
  created_at: string;
};

type Room = {
  id: string;
  name: string;
  created_at: string;
};

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
      const response = await fetch('http://localhost:4000/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `Adventure Room ${Date.now()}`, 
          playerName: playerName.trim() 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create room');
      }
      
      const { room: roomData, player } = await response.json();
      setRoom(roomData);
      setCreatedRoomCode(roomData.id);
      setCurrentPlayer(player);
      setPlayers([player]);
      setIsInRoom(true);
      setIsRoomCreator(true);
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
      const response = await fetch('http://localhost:4000/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomCode: roomCode.trim(), 
          playerName: playerName.trim() 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join room');
      }
      
      const { room: roomData, player } = await response.json();
      setRoom(roomData);
      setCreatedRoomCode(roomData.id);
      setCurrentPlayer(player);
      setIsInRoom(true);
      setIsRoomCreator(false);
      
      // Fetch all players in the room
      await fetchPlayers(roomData.id);
    } catch (error) {
      alert('Error joining room: ' + (error as Error).message);
    }
  };

  const fetchPlayers = async (roomId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/rooms/${roomId}/players`);
      if (response.ok) {
        const playersData = await response.json();
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const startGame = () => {
    window.location.href = `/story-selection?room=${createdRoomCode || roomCode}`;
  };

  // Real-time player updates
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${room.id}`
        },
        (payload) => {
          console.log('Player change:', payload);
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

        {/* Ready Button */}
        {isRoomCreator && (
          <button
            onClick={startGame}
            disabled={players.length < 1}
            style={{
              width: "100%",
              padding: "20px 24px",
              borderRadius: 8,
              border: "none",
              background: players.length >= 1 ? "linear-gradient(45deg, #4ade80, #22c55e)" : "rgba(255, 255, 255, 0.1)",
              color: players.length >= 1 ? "#000000" : "rgba(255, 255, 255, 0.5)",
              fontSize: 18,
              fontWeight: 600,
              cursor: players.length >= 1 ? "pointer" : "not-allowed",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              if (players.length >= 1) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(74, 222, 128, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (players.length >= 1) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {players.length >= 1 ? "Ready to Start Adventure" : "Waiting for Players..."}
          </button>
        )}
      </div>
    </div>
  );
}
