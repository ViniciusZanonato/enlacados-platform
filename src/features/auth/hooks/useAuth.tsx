import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/api/supabase/client";
import { useQuery } from "@tanstack/react-query";

const fetchProfileById = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  // 1. Try to find existing profile
  if (data && data.length > 0) {
    return data[0];
  }

  // 2. If not found, call fallback RPC to create it on the fly
  try {
    const { data: newProfile, error: rpcError } = await supabase.rpc('ensure_user_profile');

    if (rpcError) {
      console.error("Failed to ensure profile:", rpcError);
      return null;
    }

    return newProfile;
  } catch (err) {
    console.error("Error in ensure_user_profile fallback:", err);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfileById(user!.id),
    enabled: !!user, // Only run query if user exists
  });

  useEffect(() => {
    setAuthLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loading = authLoading || isProfileLoading;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/portal`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          terms_accepted_at: new Date().toISOString(),
          terms_version: '1.0',
        },
      },
    });
    return { error };
  };

  const signUpWithProfile = async (
    email: string,
    password: string,
    fullName: string,
    profileType: string
  ) => {
    const redirectUrl = `${window.location.origin}/portal`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          profile_type: profileType,
        },
      },
    });

    if (!error && data.user) {
      // The 'handle_new_user' trigger automatically creates the entry in 'public.profiles'.
      // Specific profile creation is now handled by the database function.
      // No client-side specific profile insertion needed here.
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    profile, // Return the new profile state
    signIn,
    signUp,
    signUpWithProfile,
    signOut,
  };
};
