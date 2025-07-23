// Test file to verify Prisma integration with existing Supabase data
import { prisma } from './prisma'

export async function testPrismaConnection() {
  try {
    console.log('🔍 Testing Prisma connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Test reading locations
    const locations = await prisma.locations.findMany({
      take: 5
    })
    console.log(`📍 Found ${locations.length} locations:`, locations.map(l => l.name))
    
    // Test reading dogs with relationships
    const dogs = await prisma.dogs.findMany({
      take: 3,
      include: {
        locations: true,
        events: {
          take: 2,
          orderBy: { created_at: 'desc' }
        }
      }
    })
    console.log(`🐕 Found ${dogs.length} dogs:`)
    dogs.forEach(dog => {
      console.log(`  - ${dog.name} (${dog.status}) in ${dog.locations.name}`)
      console.log(`    Events: ${dog.events.length}`)
    })
    
    // Test reading users/profiles
    const users = await prisma.public_users.findMany({
      take: 3,
      include: {
        locations: true
      }
    })
    console.log(`👥 Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role})`)
    })
    
    // Test messages and conversations
    const conversations = await prisma.conversations.findMany({
      take: 2,
      include: {
        messages_messages_conversation_idToconversations: {
          take: 1,
          orderBy: { created_at: 'desc' }
        }
      }
    })
    console.log(`💬 Found ${conversations.length} conversations with recent messages`)
    
    await prisma.$disconnect()
    console.log('✅ Prisma integration test completed successfully!')
    
    return { success: true, message: 'All tests passed' }
  } catch (error) {
    console.error('❌ Prisma test failed:', error)
    await prisma.$disconnect().catch(() => {})
    return { success: false, error: error.message }
  }
}

// Example usage with proper TypeScript types
export async function getDogWithDetails(dogId: string) {
  return await prisma.dogs.findUnique({
    where: { id: dogId },
    include: {
      locations: true,
      events: {
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      },
      conversations: {
        include: {
          messages_messages_conversation_idToconversations: {
            take: 5,
            orderBy: { created_at: 'desc' }
          }
        }
      }
    }
  })
}

// Example of a more complex query with filtering
export async function getDogsInLocation(locationId: string, status?: string) {
  return await prisma.dogs.findMany({
    where: {
      location_id: locationId,
      ...(status && { status })
    },
    include: {
      locations: true,
      events: {
        where: { is_private: false },
        orderBy: { created_at: 'desc' },
        take: 3
      }
    },
    orderBy: { updated_at: 'desc' }
  })
}