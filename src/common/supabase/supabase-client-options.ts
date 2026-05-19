import type {
  SupabaseClientOptions,
  WebSocketLikeConstructor,
} from '@supabase/supabase-js';
import WebSocket from 'ws';

export const serverSupabaseOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: {
    transport: WebSocket as unknown as WebSocketLikeConstructor,
  },
} satisfies SupabaseClientOptions<'public'>;
