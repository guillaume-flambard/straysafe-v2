import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Force initialization after 15 seconds if still not initialized
    const forceInitTimeout = setTimeout(() => {
      if (isMounted && !initialized) {
        console.log('Force initializing after timeout');
        setInitialized(true);
        setIsLoadingProfile(false);
      }
    }, 15000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log('Initial session:', session ? 'exists' : 'none');
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setInitialized(true);
      }
    }).catch((error) => {
      console.error('Failed to get session:', error);
      if (isMounted) {
        setInitialized(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state change:', event, session ? 'session exists' : 'no session');
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setInitialized(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(forceInitTimeout);
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    // Prevent concurrent profile loading
    if (isLoadingProfile) {
      console.log('Profile loading already in progress, skipping...');
      return;
    }
    
    console.log('Loading profile for user:', supabaseUser.id);
    setIsLoadingProfile(true);
    
    try {
      // Add timeout to the query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 5000);
      });
      
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('Profile query completed:', { 
        hasProfile: !!profile, 
        errorCode: error?.code 
      });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Profile query error:', error);
        setUser(null);
      } else if (profile) {
        const userProfile: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as UserRole,
          locationId: profile.location_id,
          avatar: profile.avatar,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        };
        console.log('Profile loaded successfully:', userProfile.name);
        setUser(userProfile);
      } else {
        console.log('No profile found - redirect to complete registration');
        setUser(null);
      }
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
      if (error?.message === 'Profile query timeout') {
        console.error('Query timed out, will retry...');
        // Don't set user to null on timeout - let it retry
        return;
      }
      setUser(null);
    } finally {
      setInitialized(true);
      setIsLoadingProfile(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // User profile will be loaded automatically via the auth state change listener
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'viewer', locationId?: string) => {
    setLoading(true);
    try {
      // First create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        // User created but needs to confirm email
        return { 
          success: true, 
          user: data.user, 
          message: 'Please check your email to confirm your account.' 
        };
      }

      // If user is signed in immediately, create the profile manually
      if (data.user && data.session) {
        console.log('Creating user profile for:', data.user.id);
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              name: name,
              role: role,
              location_id: locationId
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            console.error('Error details:', JSON.stringify(profileError, null, 2));
            return { success: false, error: `Failed to create user profile: ${profileError.message}` };
          }
          
          console.log('User profile created successfully');
          // Reload the profile after creation to update the user state
          await loadUserProfile(data.user);
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
          return { success: false, error: 'Failed to create user profile' };
        }
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Failed to sign out' };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (requiredRole: UserRole) => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      vet: 2,
      volunteer: 1,
      viewer: 0
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return {
    user,
    loading,
    initialized,
    session,
    signIn,
    signUp,
    signOut,
    hasPermission
  };
});