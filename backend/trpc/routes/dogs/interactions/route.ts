import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../../../create-context";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!
);

const interactionsRouter = createTRPCRouter({
  // Add interest to a dog (adoption, foster, sponsor, favorite)
  addInterest: publicProcedure
    .input(z.object({
      dogId: z.string().uuid(),
      interestType: z.enum(['adoption', 'foster', 'sponsor', 'favorite']),
      notes: z.string().optional(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('user_dog_interests')
        .upsert({
          user_id: input.userId,
          dog_id: input.dogId,
          interest_type: input.interestType,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Remove interest from a dog
  removeInterest: publicProcedure
    .input(z.object({
      dogId: z.string().uuid(),
      interestType: z.enum(['adoption', 'foster', 'sponsor', 'favorite']),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('user_dog_interests')
        .delete()
        .eq('user_id', input.userId)
        .eq('dog_id', input.dogId)
        .eq('interest_type', input.interestType);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  // Get interests for a dog
  getInterests: publicProcedure
    .input(z.object({
      dogId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('user_dog_interests')
        .select(`
          id,
          interest_type,
          notes,
          created_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('dog_id', input.dogId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get user's interests (for checking current state)
  getUserInterests: publicProcedure
    .input(z.object({
      dogId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('user_dog_interests')
        .select('interest_type')
        .eq('user_id', input.userId)
        .eq('dog_id', input.dogId);

      if (error) throw new Error(error.message);
      return data.map(item => item.interest_type);
    }),

  // Add comment to a dog
  addComment: publicProcedure
    .input(z.object({
      dogId: z.string().uuid(),
      content: z.string().min(1).max(1000),
      userId: z.string().uuid(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('dog_comments')
        .insert({
          dog_id: input.dogId,
          user_id: input.userId,
          content: input.content,
          is_public: input.isPublic,
        })
        .select(`
          id,
          content,
          is_public,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Get comments for a dog
  getComments: publicProcedure
    .input(z.object({
      dogId: z.string().uuid(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('dog_comments')
        .select(`
          id,
          content,
          is_public,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('dog_id', input.dogId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) throw new Error(error.message);
      return data;
    }),

  // Update comment
  updateComment: publicProcedure
    .input(z.object({
      commentId: z.string().uuid(),
      content: z.string().min(1).max(1000),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('dog_comments')
        .update({
          content: input.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.commentId)
        .eq('user_id', input.userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // Delete comment
  deleteComment: publicProcedure
    .input(z.object({
      commentId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('dog_comments')
        .delete()
        .eq('id', input.commentId)
        .eq('user_id', input.userId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),
});

export default interactionsRouter;