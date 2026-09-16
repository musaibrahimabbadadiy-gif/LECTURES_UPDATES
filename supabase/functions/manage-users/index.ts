import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// Strict CORS origin allowlist (no wildcards, no arbitrary reflection)
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://lectures-updates.vercel.app"
]);

// UUID v4 / standard UUID format validator
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };

  // Only grant Access-Control-Allow-Origin if the incoming origin is explicitly allowlisted
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

function jsonResponse(data: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: req ? getCorsHeaders(req) : { "Content-Type": "application/json" }
  });
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405, req);
  }

  try {
    // 2. Authentication check: Extract and verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized: Missing or malformed Authorization header." }, 401, req);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ error: "Unauthorized: Empty authentication token." }, 401, req);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment secrets.");
      return jsonResponse({ error: "Server configuration error." }, 500, req);
    }

    // Privileged server client (never exposed to browser)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify caller identity via Supabase Auth
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !callerUser) {
      return jsonResponse({ error: "Unauthorized: Invalid or expired session." }, 401, req);
    }

    // 3. Authorization check: Verify caller has role === 'admin' in database
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      console.warn(`User ${callerUser.id} has no profile record.`);
      return jsonResponse({ error: "Forbidden: User profile not found." }, 403, req);
    }

    if (callerProfile.role !== "admin") {
      console.warn(`Access denied: User ${callerUser.id} has role '${callerProfile.role}', requires 'admin'.`);
      return jsonResponse({ error: "Forbidden: Administrator privileges required." }, 403, req);
    }

    // 4. Parse request body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON payload." }, 400, req);
    }

    const { action } = body;
    if (!action) {
      return jsonResponse({ error: "Missing required 'action' parameter." }, 400, req);
    }

    // ══════════════════════════════════════════════════
    // ACTION: list
    // ══════════════════════════════════════════════════
    if (action === "list") {
      // List auth users
      const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (listError) {
        console.error("listUsers error:", listError);
        return jsonResponse({ error: "Failed to list users from auth." }, 500, req);
      }

      // Fetch all profile rows
      const { data: profiles, error: profilesFetchError } = await supabaseAdmin
        .from("profiles")
        .select("id, role, created_at, updated_at");

      if (profilesFetchError) {
        console.error("profiles fetch error:", profilesFetchError);
        return jsonResponse({ error: "Failed to retrieve user profiles." }, 500, req);
      }

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Return sanitized list
      const safeUsers = (authUsers || []).map(u => {
        const prof = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email || "",
          role: prof?.role || "class_rep",
          created_at: prof?.created_at || u.created_at,
          last_sign_in_at: u.last_sign_in_at || null,
          is_current_user: u.id === callerUser.id
        };
      });

      // Sort: admins first, then by created_at desc
      safeUsers.sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return jsonResponse({ users: safeUsers }, 200, req);
    }

    // ══════════════════════════════════════════════════
    // ACTION: create
    // ══════════════════════════════════════════════════
    if (action === "create") {
      const { email, password } = body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return jsonResponse({ error: "A valid email address is required." }, 400, req);
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters long." }, 400, req);
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Enforce role=class_rep server-side (Admins cannot create other admins directly in this phase)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: "class_rep"
        }
      });

      if (createError) {
        console.error("createUser error:", createError);
        return jsonResponse({ error: createError.message || "Failed to create user." }, 400, req);
      }

      const createdUser = newUser.user;
      if (!createdUser) {
        return jsonResponse({ error: "User creation failed unexpectedly." }, 500, req);
      }

      // Ensure profile exists with role=class_rep (in case trigger was delayed)
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("id", createdUser.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabaseAdmin
          .from("profiles")
          .insert([{ id: createdUser.id, role: "class_rep" }]);
      }

      return jsonResponse({
        success: true,
        message: "Class Rep account created successfully.",
        user: {
          id: createdUser.id,
          email: createdUser.email,
          role: "class_rep",
          created_at: createdUser.created_at
        }
      }, 201, req);
    }

    // ══════════════════════════════════════════════════
    // ACTION: delete
    // ══════════════════════════════════════════════════
    if (action === "delete") {
      const { targetUserId } = body;

      if (!targetUserId || !isValidUuid(targetUserId)) {
        return jsonResponse({ error: "Invalid or malformed target user ID. Must be a valid UUID." }, 400, req);
      }

      // Self-lockout protection: Caller cannot delete their own account
      if (targetUserId === callerUser.id) {
        return jsonResponse({ error: "Self-deletion is forbidden. You cannot delete your own admin account." }, 400, req);
      }

      // Fetch target user's profile
      const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("id", targetUserId)
        .maybeSingle();

      if (targetProfileError || !targetProfile) {
        return jsonResponse({ error: "Target user not found." }, 404, req);
      }

      // Safety rule: Reject deletion of other Admins in this phase
      if (targetProfile.role === "admin") {
        return jsonResponse({ error: "Cannot delete an Administrator account. Demote to Class Rep first if intended." }, 400, req);
      }

      // Delete from auth.users (cascades to public.profiles)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteError) {
        console.error("deleteUser error:", deleteError);
        return jsonResponse({ error: deleteError.message || "Failed to delete user." }, 500, req);
      }

      return jsonResponse({
        success: true,
        message: "User account deleted successfully."
      }, 200, req);
    }

    // ══════════════════════════════════════════════════
    // ACTION: update_role
    // ══════════════════════════════════════════════════
    if (action === "update_role") {
      const { targetUserId, newRole } = body;

      if (!targetUserId || !isValidUuid(targetUserId)) {
        return jsonResponse({ error: "Invalid or malformed target user ID. Must be a valid UUID." }, 400, req);
      }

      if (newRole !== "class_rep" && newRole !== "admin") {
        return jsonResponse({ error: "Invalid role. Allowed values: 'class_rep', 'admin'." }, 400, req);
      }

      // Self-lockout protection: Caller cannot modify their own role
      if (targetUserId === callerUser.id) {
        return jsonResponse({ error: "You cannot change your own administrative role." }, 400, req);
      }

      // Fetch target user's profile
      const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("id", targetUserId)
        .maybeSingle();

      if (targetProfileError || !targetProfile) {
        return jsonResponse({ error: "Target user not found." }, 404, req);
      }

      // If demoting an admin, ensure system doesn't end up with zero admins
      if (targetProfile.role === "admin" && newRole === "class_rep") {
        const { count: adminCount, error: countError } = await supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");

        if (countError) {
          console.error("Admin count check error:", countError);
          return jsonResponse({ error: "Unable to verify admin count." }, 500, req);
        }

        if ((adminCount || 0) <= 1) {
          return jsonResponse({ error: "Cannot demote the last remaining Administrator." }, 409, req);
        }
      }

      // Update role in profiles
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role: newRole })
        .eq("id", targetUserId);

      if (updateError) {
        console.error("update role error:", updateError);
        return jsonResponse({ error: updateError.message || "Failed to update role." }, 500, req);
      }

      return jsonResponse({
        success: true,
        message: `User role updated to ${newRole === "admin" ? "Administrator" : "Class Representative"}.`,
        user: {
          id: targetUserId,
          role: newRole
        }
      }, 200, req);
    }

    return jsonResponse({ error: `Unknown action '${action}'.` }, 400, req);

  } catch (err: any) {
    console.error("Unexpected Edge Function error:", err);
    return jsonResponse({ error: "Internal server error." }, 500, req);
  }
});
