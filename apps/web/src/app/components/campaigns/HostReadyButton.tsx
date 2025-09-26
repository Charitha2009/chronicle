"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Campaign } from "../types";

interface HostReadyButtonProps {
  campaign: Campaign;
  campaignId: string;
  lockedCharacters: number;
  totalPlayers: number;
  onStartCampaign: () => void;
}

export default function HostReadyButton({ 
  campaign, 
  campaignId, 
  lockedCharacters, 
  totalPlayers,
  onStartCampaign 
}: HostReadyButtonProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isUserHost, setIsUserHost] = useState(false);

  // Check if current user is the host
  useEffect(() => {
    const checkHost = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const hostStatus = user && campaign?.host_user_id === user.id;
        setIsUserHost(hostStatus || false);
        console.log('Host check:', { user_id: user?.id, host_user_id: campaign?.host_user_id, isUserHost: hostStatus });
      } catch (error) {
        console.error('Error checking host status:', error);
        setIsUserHost(false);
      }
    };
    
    if (campaign?.host_user_id) {
      checkHost();
    }
  }, [campaign?.host_user_id]);

  const handleReadyToStart = async () => {
    setIsStarting(true);
    
    try {
      // Call the start campaign API endpoint
      const response = await fetch(`http://localhost:4000/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start campaign');
      }

      const result = await response.json();
      
      // Notify all players to navigate to the play room
      await onStartCampaign();
      
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert('Error starting campaign: ' + (error as Error).message);
      setIsStarting(false);
    }
  };

  console.log('Debug - Host:', isUserHost, 'Locked/Total:', lockedCharacters + '/' + totalPlayers);
  
  // Show the button if host and we have at least one locked character  
  if (!isUserHost || lockedCharacters === 0) {
    return null;
  }
  
  const allLocked = lockedCharacters === totalPlayers;
  
  return (
    <div style={{
      background: "rgba(74, 222, 128, 0.1)",
      borderRadius: 16,
      padding: 24,
      border: "2px solid rgba(74, 222, 128, 0.3)",
      textAlign: "center",
      marginTop: 32
    }}>
      <h3 style={{
        fontSize: 20,
        fontWeight: 600,
        color: "#ffffff",
        marginBottom: 16
      }}>
        {allLocked ? "🎯 All Players Ready!" : "📋 Players Locking In..."}
      </h3>
      
      <p style={{
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 20
      }}>
        {lockedCharacters} of {totalPlayers} players have locked their characters.
      </p>

      {allLocked && (
        <button
          onClick={handleReadyToStart}
          disabled={isStarting}
          style={{
            background: isStarting 
              ? "rgba(74, 222, 128, 0.3)" 
              : "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#ffffff",
            border: "none",
            padding: "16px 32px",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 600,
            cursor: isStarting ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 20px rgba(74, 222, 128, 0.3)",
            boxSizing: "border-box",
            minWidth: 200
          }}
        >
          {isStarting ? (
            <>
              <span style={{ display: "inline-block", marginRight: 8 }}>🔄</span>
              Starting Adventure...
            </>
          ) : (
            <>
              <span style={{ display: "inline-block", marginRight: 8 }}>🚀</span>
              Begin the Adventure!
            </>
          )}
        </button>
      )}
      
      {!allLocked && (
        <div style={{
          padding: "12px 24px",
          borderRadius: 8,
          background: "rgba(74, 222, 128, 0.05)",
          border: "1px solid rgba(74, 222, 128, 0.2)",
          color: "rgba(255, 255, 255, 0.6)"
        }}>
          Waiting for {totalPlayers - lockedCharacters} more player{totalPlayers - lockedCharacters !== 1 ? 's' : ''} to lock characters...
        </div>
      )}
      
      <p style={{
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.5)",
        marginTop: 12
      }}>
        This will start the campaign and redirect all players.
      </p>
    </div>
  );

}
