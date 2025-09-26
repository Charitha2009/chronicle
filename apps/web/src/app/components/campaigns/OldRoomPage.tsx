"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthWidget from "../../../components/AuthWidget";

type Scene = {
  id: number;
  room_id: string;
  turn_number: number;
  content: string;
  created_at: string;
  room_name?: string;
};

type Choice = {
  id: number;
  scene_id: number;
  text: string;
  choice_letter: string;
  created_at: string;
};

type Vote = {
  id: number;
  scene_id: number;
  player_id: number;
  choice_id: number;
  created_at: string;
};

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const roomId = params.id;
  const genre = searchParams.get("genre");
  const [scene, setScene] = useState<Scene | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [playerVote, setPlayerVote] = useState<Vote | null>(null);
  const [status, setStatus] = useState("Loading…");
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [playerJoined, setPlayerJoined] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<{ id: number; user_id: string; room_id: string; display_name: string } | null>(null);
  const [voting, setVoting] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [storyStarted, setStoryStarted] = useState(false);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadScene = useCallback(async () => {
    const base = process.env.NEXT_PUBLIC_API_URL!;
    try {
      const response = await fetch(`${base}/rooms/${roomId}/scene`);
      const sceneData = await response.json();
      setScene(sceneData);
      
      if (sceneData && sceneData.id) {
        // Load choices for this scene
        const choicesResponse = await fetch(`${base}/scenes/${sceneData.id}/choices`);
        const choicesData = await choicesResponse.json();
        setChoices(choicesData || []);
        
        // Load player's vote if they have one
        if (currentPlayer) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            try {
              const voteResponse = await fetch(`${base}/votes?scene_id=${sceneData.id}&player_id=${currentPlayer.id}`, {
                headers: {
                  "Authorization": `Bearer ${session.access_token}`,
                },
              });
              
              if (voteResponse.ok) {
                const voteData = await voteResponse.json();
                setPlayerVote(voteData);
              }
            } catch (e) {
              console.error("Error loading player vote:", e);
            }
          }
        }
      }
      
      setStatus("");
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  }, [roomId, currentPlayer]);

  const joinAsPlayer = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const base = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${base}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          room_id: roomId,
          display_name: user.user_metadata?.full_name || user.email || "Anonymous",
        }),
      });

      if (response.ok) {
        const playerData = await response.json();
        setCurrentPlayer(playerData);
        setPlayerJoined(true);
      } else {
        const error = await response.json();
        setStatus(`Error joining room: ${error.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  }, [user, roomId]);

  useEffect(() => {
    // Join as player when user is authenticated
    if (user && !playerJoined) {
      joinAsPlayer();
    }
  }, [user, playerJoined, joinAsPlayer]);

  useEffect(() => {
    // Load scene when player joins
    if (playerJoined && currentPlayer) {
      loadScene();
    }
  }, [playerJoined, currentPlayer, loadScene]);

  const refetchVotes = useCallback(async () => {
    if (!scene || !currentPlayer) return;
    
    const base = process.env.NEXT_PUBLIC_API_URL!;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const voteResponse = await fetch(`${base}/votes?scene_id=${scene.id}&player_id=${currentPlayer.id}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });
      
      if (voteResponse.ok) {
        const voteData = await voteResponse.json();
        setPlayerVote(voteData);
      }
    } catch (e) {
      console.error("Error refetching votes:", e);
    }
  }, [scene, currentPlayer]);

  const refetchScene = useCallback(async () => {
    const base = process.env.NEXT_PUBLIC_API_URL!;
    try {
      const response = await fetch(`${base}/rooms/${roomId}/scene`);
      const sceneData = await response.json();
      setScene(sceneData);
      
      if (sceneData && sceneData.id) {
        // Also refetch choices for the new scene
        const choicesResponse = await fetch(`${base}/scenes/${sceneData.id}/choices`);
        const choicesData = await choicesResponse.json();
        setChoices(choicesData || []);
        
        // Clear player vote since it's a new scene
        setPlayerVote(null);
      }
    } catch (e) {
      console.error("Error refetching scene:", e);
    }
  }, [roomId]);

  const startStory = async () => {
    if (!genre) return;
    
    const genreDescriptions = {
      fantasy: "A magical realm where dragons soar through enchanted forests and wizards wield ancient powers.",
      scifi: "A futuristic world of space exploration, advanced technology, and interstellar adventures.",
      horror: "A dark and mysterious place where shadows hide unspeakable terrors and ancient evils lurk.",
      mystery: "A world of intrigue and deception where every clue leads deeper into a web of secrets.",
      adventure: "An epic journey through uncharted lands filled with danger, treasure, and legendary quests.",
      romance: "A tale of love and passion where hearts collide and destinies intertwine."
    };

    const genreEmojis = {
      fantasy: "🏰",
      scifi: "🚀", 
      horror: "👻",
      mystery: "🔍",
      adventure: "🗺️",
      romance: "💕"
    };

    try {
      const base = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${base}/rooms/${roomId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `${genreEmojis[genre as keyof typeof genreEmojis]} Welcome to your ${genre} adventure! ${genreDescriptions[genre as keyof typeof genreDescriptions]} Your story begins now...`
        })
      });

      if (!response.ok) throw new Error("Failed to create first scene");
      
      setStoryStarted(true);
      // Refresh the scene
      setTimeout(() => refetchScene(), 1000);
    } catch (e) {
      if (e instanceof Error) {
        console.error("Error starting story:", e.message);
        alert("Failed to start story: " + e.message);
      }
    }
  };

  // Realtime subscriptions for live updates
  useEffect(() => {
    if (!roomId || !scene?.id) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'votes', 
          filter: `scene_id=eq.${scene.id}` 
        },
        () => {
          console.log('New vote received, refetching votes...');
          refetchVotes();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'scenes', 
          filter: `room_id=eq.${roomId}` 
        },
        () => {
          console.log('New scene received, refetching scene...');
          refetchScene();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, scene?.id, refetchVotes, refetchScene]);

  const handleVote = async (choiceId: number) => {
    if (!scene || !currentPlayer || voting) return;
    
    setVoting(true);
    const base = process.env.NEXT_PUBLIC_API_URL!;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`${base}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          scene_id: scene.id,
          player_id: currentPlayer.id,
          choice_id: choiceId,
        }),
      });

      if (response.ok) {
        const voteData = await response.json();
        setPlayerVote(voteData);
      } else {
        const error = await response.json();
        setStatus(`Error voting: ${error.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setVoting(false);
    }
  };

  // Story welcome screen
  if (genre && !storyStarted) {
    const genreTitles = {
      fantasy: "Fantasy Adventure",
      scifi: "Sci-Fi Adventure", 
      horror: "Horror Adventure",
      mystery: "Mystery Adventure",
      adventure: "Epic Adventure",
      romance: "Romance Adventure"
    };

    const genreEmojis = {
      fantasy: "🏰",
      scifi: "🚀", 
      horror: "👻",
      mystery: "🔍",
      adventure: "🗺️",
      romance: "💕"
    };

    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#0a0a0a",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px"
      }}>
        <div style={{ maxWidth: 800, width: "100%", textAlign: "center" }}>
          {/* Header */}
          <div style={{ marginBottom: 60 }}>
            <Link href="/lobby" style={{ textDecoration: "none", color: "#ffffff", fontSize: 16, opacity: 0.7 }}>
              ← Back to Lobby
            </Link>
            <h1 style={{ 
              fontSize: 48, 
              fontWeight: 400, 
              fontFamily: "serif",
              color: "#f5f5f5",
              margin: "20px 0"
            }}>
              Chronicle
            </h1>
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
                {roomId}
              </span>
            </div>
          </div>

          {/* Story Welcome */}
          <div style={{ 
            background: "rgba(255, 255, 255, 0.05)", 
            borderRadius: 20, 
            padding: 48,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: 40
          }}>
            <div style={{ fontSize: 80, marginBottom: 24 }}>
              {genreEmojis[genre as keyof typeof genreEmojis]}
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 600, marginBottom: 16, color: "#ffffff" }}>
              {genreTitles[genre as keyof typeof genreTitles]}
            </h2>
            <p style={{ fontSize: 18, opacity: 0.8, lineHeight: 1.6, marginBottom: 32 }}>
              Welcome to your collaborative storytelling adventure! 
              Together, you and your fellow players will craft an epic tale through choices and decisions.
              Each choice shapes the story, and every player's voice matters.
            </p>
            <button
              onClick={startStory}
              style={{
                padding: "20px 48px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(45deg, #4ade80, #22c55e)",
                color: "#000000",
                fontSize: 20,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(74, 222, 128, 0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(74, 222, 128, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(74, 222, 128, 0.3)";
              }}
            >
              Begin the Adventure
            </button>
          </div>

          {/* Instructions */}
          <div style={{ opacity: 0.6, fontSize: 14 }}>
            <p>Once started, players will vote on story choices and the adventure unfolds in real-time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Link href="/lobby" style={{ textDecoration: "underline" }}>← Back to Lobby</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {realtimeConnected && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 4, 
              fontSize: 12, 
              color: "#28a745",
              opacity: 0.8 
            }}>
              <div style={{ 
                width: 6, 
                height: 6, 
                borderRadius: "50%", 
                backgroundColor: "#28a745",
                animation: "pulse 2s infinite"
              }}></div>
              Live
            </div>
          )}
          <AuthWidget />
        </div>
      </div>
      
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>
        Room {scene?.room_name ? `— ${scene.room_name}` : ""}
      </h1>
      
      {!user && (
        <div style={{ padding: 16, border: "1px solid #ffa500", borderRadius: 8, background: "#fff3cd", marginBottom: 16 }}>
          <p style={{ margin: 0, color: "#856404" }}>
            Please sign in to join this room.
          </p>
        </div>
      )}
      
      {user && !playerJoined && (
        <div style={{ padding: 16, border: "1px solid #007bff", borderRadius: 8, background: "#d1ecf1", marginBottom: 16 }}>
          <p style={{ margin: 0, color: "#0c5460" }}>
            Joining room as {user.user_metadata?.full_name || user.email || "Anonymous"}...
          </p>
        </div>
      )}
      
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
              marginBottom: 20,
            }}
          >
            {scene.content || "No scene yet. (We'll add AI narration next.)"}
          </pre>

          {choices.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                What do you choose?
              </h3>
              
              {playerVote ? (
                <div style={{ padding: 16, border: "1px solid #28a745", borderRadius: 8, background: "#d4edda", marginBottom: 16 }}>
                  <p style={{ margin: 0, color: "#155724" }}>
                    ✓ You voted: <strong>{choices.find(c => c.id === playerVote.choice_id)?.text}</strong>
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleVote(choice.id)}
                      disabled={voting}
                      style={{
                        padding: "12px 16px",
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        background: "#fff",
                        cursor: voting ? "not-allowed" : "pointer",
                        textAlign: "left",
                        fontSize: 14,
                        opacity: voting ? 0.6 : 1,
                      }}
                    >
                      <strong>{choice.choice_letter}.</strong> {choice.text}
                    </button>
                  ))}
                </div>
              )}

              {voting && (
                <p style={{ marginTop: 8, opacity: 0.7, fontSize: 14 }}>
                  Submitting your vote...
                </p>
              )}
            </div>
          )}

          {choices.length === 0 && scene && (
            <div style={{ padding: 16, border: "1px solid #ffc107", borderRadius: 8, background: "#fff3cd", marginTop: 20 }}>
              <p style={{ margin: 0, color: "#856404" }}>
                No choices available yet. The game master will add choices soon.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}