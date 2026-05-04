
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export async function submitAmbassadorRequest(params: {
  platform: 'instagram' | 'tiktok';
  handle: string;
}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase keys are missing");
    return { error: "Configuration missing" };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ambassador_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        platform: params.platform,
        handle: params.handle,
        created_at: new Date().toISOString(),
        status: 'pending'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || "Failed to submit" };
    }

    return { data: true };
  } catch (error) {
    console.error("Supabase submit error:", error);
    return { error: "Network error" };
  }
}
