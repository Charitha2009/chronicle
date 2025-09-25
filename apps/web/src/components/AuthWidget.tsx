"use client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, signIn, signOut } from "../lib/supabase";

export default function AuthWidget() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    const { error } = await signIn(email);
    if (error) {
      console.error("Error sending magic link:", error);
      alert("Error sending magic link: " + error.message);
    } else {
      setEmailSent(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return <div style={{ opacity: 0.7 }}>Loading...</div>;
  }

  if (!user) {
    if (emailSent) {
      return (
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <div style={{ marginBottom: 8, color: "#4ade80" }}>
            ✅ Magic link sent!
          </div>
          <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
            Check your email and click the link to sign in.
          </div>
          <button
            onClick={() => {
              setEmailSent(false);
              setShowEmailForm(false);
              setEmail("");
            }}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #ccc",
              background: "#f5f5f5",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Try different email
          </button>
        </div>
      );
    }

    if (!showEmailForm) {
      return (
        <button
          onClick={() => setShowEmailForm(true)}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            border: "1px solid #333",
            borderRadius: "6px",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Sign In with Email
        </button>
      );
    }

    return (
      <form onSubmit={handleEmailSubmit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: "#fff",
            color: "#333",
            minWidth: 200,
          }}
          required
        />
        <button
          type="submit"
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            border: "1px solid #333",
            borderRadius: "6px",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Send Link
        </button>
        <button
          type="button"
          onClick={() => {
            setShowEmailForm(false);
            setEmail("");
          }}
          style={{
            padding: "6px 12px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            background: "#f5f5f5",
            color: "#333",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "14px", opacity: 0.8 }}>
        {user.email}
      </span>
      <button
        onClick={handleSignOut}
        style={{
          padding: "6px 12px",
          fontSize: "14px",
          border: "1px solid #666",
          borderRadius: "6px",
          background: "transparent",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
