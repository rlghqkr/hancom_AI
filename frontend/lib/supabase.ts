import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// 모듈을 import 하는 시점이 아니라 처음 쓰는 시점에 만든다.
// 빌드 중 정적 프리렌더에서는 env 값이 없어도 되고, 실제 호출 시에만 필요하다.
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
