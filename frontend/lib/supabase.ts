import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 없습니다. .env.local 을 확인하세요.');
}

export const supabase = createClient(url, anonKey);
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
