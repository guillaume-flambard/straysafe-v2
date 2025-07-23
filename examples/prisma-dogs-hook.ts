// Example: Using Prisma in your existing dogs hook
// This shows how to gradually migrate from direct Supabase calls to Prisma

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase' // Keep for RLS/Auth

export function useDogsWithPrisma() {
  const queryClient = useQueryClient()

  // Read operations - Use Prisma for better type safety and relations
  const { data: dogs, isLoading } = useQuery({
    queryKey: ['dogs'],
    queryFn: async () => {
      return await prisma.dogs.findMany({
        include: {
          locations: true,
          events: {
            where: { is_private: false },
            orderBy: { created_at: 'desc' },
            take: 5,
            include: {
              users: {
                select: { id: true, name: true, avatar: true }
              }
            }
          }
        },
        orderBy: { updated_at: 'desc' }
      })
    }
  })

  // Write operations - Keep using Supabase for RLS policies
  const addDogMutation = useMutation({
    mutationFn: async (dogData: {
      name: string
      status: string
      location_id: string
      // ... other fields
    }) => {
      // Use Supabase for inserts to respect RLS
      const { data, error } = await supabase
        .from('dogs')
        .insert(dogData)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate queries to refetch with Prisma
      queryClient.invalidateQueries({ queryKey: ['dogs'] })
    }
  })

  // Complex read with filtering - Prisma excels here
  const getDogsByLocation = async (locationId: string, filters?: {
    status?: string
    gender?: string
    isNeutered?: boolean
  }) => {
    return await prisma.dogs.findMany({
      where: {
        location_id: locationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.gender && { gender: filters.gender }),
        ...(filters?.isNeutered !== undefined && { is_neutered: filters.isNeutered })
      },
      include: {
        locations: true,
        events: {
          orderBy: { created_at: 'desc' },
          take: 3
        }
      }
    })
  }

  // Get detailed dog info with all relations
  const getDogDetails = async (dogId: string) => {
    return await prisma.dogs.findUnique({
      where: { id: dogId },
      include: {
        locations: true,
        events: {
          orderBy: { created_at: 'desc' },
          include: {
            users: true
          }
        },
        conversations: {
          include: {
            conversation_participants: true,
            messages_messages_conversation_idToconversations: {
              take: 10,
              orderBy: { created_at: 'desc' }
            }
          }
        }
      }
    })
  }

  return {
    dogs,
    isLoading,
    addDog: addDogMutation.mutate,
    getDogsByLocation,
    getDogDetails
  }
}

// Example of migrating your existing functions
export function migratedDogQueries() {
  // Old way (direct Supabase)
  const oldGetDogs = async () => {
    const { data, error } = await supabase
      .from('dogs')
      .select(`
        *,
        locations (*),
        events (*)
      `)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // New way (Prisma with full TypeScript support)
  const newGetDogs = async () => {
    return await prisma.dogs.findMany({
      include: {
        locations: true,
        events: {
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { updated_at: 'desc' }
    })
  }

  return { oldGetDogs, newGetDogs }
}