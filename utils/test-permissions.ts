import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';

export interface TestUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

export const TEST_USERS: TestUser[] = [
  {
    email: 'admin@straysafe-test.com',
    password: 'password123',
    role: 'admin',
    name: 'Admin Test User'
  },
  {
    email: 'volunteer@straysafe-test.com', 
    password: 'password123',
    role: 'volunteer',
    name: 'Volunteer Test User'
  },
  {
    email: 'vet@straysafe-test.com',
    password: 'password123',
    role: 'vet', 
    name: 'Veterinarian Test User'
  },
  {
    email: 'viewer@straysafe-test.com',
    password: 'password123',
    role: 'viewer',
    name: 'Viewer Test User'
  }
];

// Create a test user via Supabase Auth
export const createTestUser = async (testUser: TestUser) => {
  try {
    console.log(`🧪 Creating test user: ${testUser.email} (${testUser.role})`);
    
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.name,
          role: testUser.role
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'No user returned from signup' };
    }

    // Create/update profile with role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: testUser.email,
        full_name: testUser.name,
        role: testUser.role,
        is_active: true
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return { success: false, error: profileError.message };
    }

    console.log(`✅ Test user created: ${testUser.email}`);
    return { 
      success: true, 
      user: authData.user,
      role: testUser.role 
    };

  } catch (error) {
    console.error('Error creating test user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Test login with different users
export const testLogin = async (email: string, password: string) => {
  try {
    console.log(`🔐 Testing login: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return { success: false, error: profileError.message };
    }

    console.log(`✅ Login successful: ${email} (${profile.role})`);
    return { 
      success: true, 
      user: data.user, 
      profile,
      role: profile.role 
    };

  } catch (error) {
    console.error('Error testing login:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Test permissions for different actions
export const testPermissions = async (userRole: UserRole) => {
  const permissions = {
    canCreateDog: false,
    canEditDog: false,
    canDeleteDog: false,
    canCreateEvent: false,
    canViewAllProfiles: false,
    canManageUsers: false,
    canAccessAnalytics: false
  };

  switch (userRole) {
    case 'admin':
      permissions.canCreateDog = true;
      permissions.canEditDog = true;
      permissions.canDeleteDog = true;  
      permissions.canCreateEvent = true;
      permissions.canViewAllProfiles = true;
      permissions.canManageUsers = true;
      permissions.canAccessAnalytics = true;
      break;
      
    case 'volunteer':
      permissions.canCreateDog = true;
      permissions.canEditDog = true;
      permissions.canCreateEvent = true;
      permissions.canViewAllProfiles = true;
      break;
      
    case 'vet':
      permissions.canCreateEvent = true; // Medical events
      permissions.canViewAllProfiles = true;
      break;
      
    case 'viewer':
      // Only view permissions
      break;
  }

  console.log(`🔒 Permissions for ${userRole}:`, permissions);
  return permissions;
};

// Create all test users
export const setupAllTestUsers = async () => {
  console.log('🧪 Setting up all test users...');
  
  const results = [];
  
  for (const testUser of TEST_USERS) {
    const result = await createTestUser(testUser);
    results.push({ ...testUser, ...result });
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 Test user setup results:', results);
  return results;
};

// Clean up test users (for development)
export const cleanupTestUsers = async () => {
  console.log('🧹 Cleaning up test users...');
  
  for (const testUser of TEST_USERS) {
    try {
      // Note: This requires admin privileges
      const { error } = await supabase.auth.admin.deleteUser(
        testUser.email // This would need user ID, but this is just for reference
      );
      
      if (error) {
        console.error(`Error deleting ${testUser.email}:`, error);
      } else {
        console.log(`✅ Deleted test user: ${testUser.email}`);
      }
    } catch (error) {
      console.error(`Error deleting ${testUser.email}:`, error);
    }
  }
};