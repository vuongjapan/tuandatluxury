import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const adminEmail = "dovuongcokhi.japan@gmail.com";
    const adminPassword = "HOIlamgi170998";

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update password just in case
      await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: adminPassword,
        email_confirm: true,
      });
    } else {
      // Create admin user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "Admin Tuấn Đạt" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Ensure admin role exists
    const { error: roleError } = await adminClient
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (roleError) throw roleError;

    // Update profile
    await adminClient
      .from("profiles")
      .upsert({ user_id: userId, full_name: "Admin Tuấn Đạt" }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({ success: true, message: "Admin account ready", email: adminEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("seed-admin error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
