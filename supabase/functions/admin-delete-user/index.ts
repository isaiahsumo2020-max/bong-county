import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type StorageObject = {
  bucket_id: string;
  name: string;
  is_versioned: boolean;
  is_delete_marker: boolean;
};

type StorageCursor = {
  bucket_id: string;
  name: string;
};

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error &&
      typeof error.message === "string") {
    return error.message;
  }
  return "An unexpected error occurred.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function encodeStoragePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getOwnedObjectPage(
  admin: SupabaseClient,
  userId: string,
  cursor: StorageCursor | null,
): Promise<StorageObject[]> {
  const { data, error } = await admin.rpc("admin_user_storage_objects", {
    p_user_id: userId,
    p_after_bucket: cursor?.bucket_id ?? null,
    p_after_name: cursor?.name ?? null,
  });

  if (error) throw new Error(`Could not inspect user-owned Storage files: ${error.message}`);
  return (data ?? []) as StorageObject[];
}

async function assertNoVersionedObjects(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  let cursor: StorageCursor | null = null;

  while (true) {
    const objects = await getOwnedObjectPage(admin, userId, cursor);
    if (objects.length === 0) return;

    const versionedObject = objects.find(object =>
      object.is_versioned || object.is_delete_marker
    );
    if (versionedObject) {
      throw new Error(
        `This account owns a versioned Storage object in bucket "${versionedObject.bucket_id}". ` +
          "Resolve its retained versions before deleting the account.",
      );
    }

    const lastObject = objects[objects.length - 1];
    cursor = { bucket_id: lastObject.bucket_id, name: lastObject.name };
    if (objects.length < 100) return;
  }
}

async function removeOwnedObjects(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  let cursor: StorageCursor | null = null;

  while (true) {
    const objects = await getOwnedObjectPage(admin, userId, cursor);
    if (objects.length === 0) return;

    for (const object of objects) {
      if (!object.bucket_id || !object.name) {
        throw new Error("Storage returned an owned file without a bucket or path.");
      }

      const rawPath = `/${object.bucket_id}/${object.name}`;
      const encodedPath = `/${object.bucket_id}/${encodeStoragePath(object.name)}`;
      let isReferenced = false;
      if (object.bucket_id !== "avatars") {
        const { data, error: referenceError } = await admin.rpc(
          "admin_user_storage_object_is_referenced",
          { p_raw_path: rawPath, p_encoded_path: encodedPath },
        );
        if (referenceError) {
          throw new Error(
            `Could not check whether Storage file "${object.name}" is used by published content: ${referenceError.message}`,
          );
        }
        isReferenced = data === true;
      }

      if (isReferenced) {
        const retainedPath = `retained/${userId}/${crypto.randomUUID()}`;
        const bucket = admin.storage.from(object.bucket_id);
        const { error: copyError } = await bucket.copy(object.name, retainedPath);
        if (copyError) {
          throw new Error(
            `Could not preserve published media in bucket "${object.bucket_id}": ${copyError.message}`,
          );
        }

        const { data: stillOwned, error: ownershipError } = await admin.rpc(
          "admin_user_storage_object_is_owned",
          {
            p_user_id: userId,
            p_bucket_id: object.bucket_id,
            p_name: retainedPath,
          },
        );
        if (ownershipError || stillOwned !== false) {
          const { error: cleanupError } = await bucket.remove([retainedPath]);
          if (cleanupError) {
            console.error("Failed to clean up an untransferred retained object:", cleanupError);
          }
          throw new Error(
            ownershipError
              ? `Could not verify media ownership transfer: ${ownershipError.message}`
              : "Storage did not transfer ownership of retained media. The account was not deleted.",
          );
        }

        const newPath = `/${object.bucket_id}/${encodeStoragePath(retainedPath)}`;
        const { data: rewrittenRows, error: rewriteError } = await admin.rpc(
          "admin_rewrite_retained_media_references",
          {
            p_old_raw_path: rawPath,
            p_old_encoded_path: encodedPath,
            p_new_path: newPath,
          },
        );

        if (rewriteError || !Number.isInteger(rewrittenRows) || rewrittenRows < 1) {
          const { error: cleanupError } = await bucket.remove([retainedPath]);
          if (cleanupError) {
            console.error("Failed to clean up an unreferenced retained object:", cleanupError);
          }
          throw new Error(
            rewriteError
              ? `Could not update retained media references: ${rewriteError.message}`
              : "Retained media references could not be verified or updated.",
          );
        }
      }

      const { error: removeError } = await admin.storage
        .from(object.bucket_id)
        .remove([object.name]);
      if (removeError) {
        throw new Error(
          `Could not remove the original Storage file "${object.name}": ${removeError.message}`,
        );
      }

      cursor = { bucket_id: object.bucket_id, name: object.name };
    }

    if (objects.length < 100) return;
  }
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return response(405, { error: "Use POST to delete a user account." });
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return response(401, { error: "A valid administrator session is required." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Supabase URL, anon key, or service-role key is unavailable to the function.");
    return response(500, { error: "Account deletion is not configured on the server." });
  }

  let body: Record<string, unknown>;
  try {
    const parsedBody: unknown = await request.json();
    if (!isRecord(parsedBody)) {
      return response(400, { error: "The request body must be a JSON object." });
    }
    body = parsedBody;
  } catch {
    return response(400, { error: "The request body must be valid JSON." });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const confirmEmail = typeof body.confirmEmail === "string" ? body.confirmEmail.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return response(400, { error: "A valid user ID is required." });
  }

  let callerId: string;
  try {
    const callerClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerResult, error: callerError } = await callerClient.auth.getUser(accessToken);
    if (callerError || !callerResult.user) {
      return response(401, { error: "Your administrator session is invalid or expired." });
    }
    callerId = callerResult.user.id;
  } catch (error) {
    console.error("Could not verify the administrator session:", error);
    return response(502, { error: "Could not verify your administrator session. Try again." });
  }

  let admin: SupabaseClient;
  try {
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    console.error("Could not initialize the privileged Supabase client:", error);
    return response(500, { error: "The server could not initialize account deletion." });
  }

  try {
    const { data: callerProfile, error: callerProfileError } = await admin
      .from("users")
      .select("role")
      .eq("id", callerId)
      .maybeSingle();
    if (callerProfileError) {
      throw new Error(`Could not verify administrator authorization: ${callerProfileError.message}`);
    }
    if (callerProfile?.role !== "super_admin") {
      return response(403, { error: "Only an authorized Super Admin can delete user accounts." });
    }

    const { data: safeguardsReady, error: safeguardsError } = await admin
      .rpc("admin_user_deletion_ready");
    if (safeguardsError) {
      console.error("Could not verify account deletion safeguards:", safeguardsError);
      return response(503, {
        error: "Database deletion safeguards are not installed. Apply the account-deletion migration first.",
      });
    }
    if (safeguardsReady !== true) {
      return response(503, {
        error: "Database deletion safeguards are incomplete. Apply the account-deletion migration first.",
      });
    }

    if (callerId === userId) {
      return response(403, { error: "You cannot delete your own Super Admin account." });
    }

    const { data: targetProfile, error: targetProfileError } = await admin
      .from("users")
      .select("email, role")
      .eq("id", userId)
      .maybeSingle();
    if (targetProfileError) {
      throw new Error(`Could not load the target user's profile: ${targetProfileError.message}`);
    }
    if (!targetProfile) {
      return response(404, { error: "The target user's profile was not found." });
    }
    if (targetProfile.role === "super_admin") {
      return response(403, { error: "Super Admin accounts are protected from dashboard deletion." });
    }
    const { data: targetAuth, error: targetAuthError } = await admin.auth.admin.getUserById(userId);
    if (targetAuthError) {
      if (targetAuthError.status === 404) {
        return response(404, { error: "The target authentication account no longer exists." });
      }
      throw new Error(`Could not verify the target authentication account: ${targetAuthError.message}`);
    }
    if (!targetAuth.user) {
      return response(404, { error: "The target authentication account no longer exists." });
    }
    if (
      typeof targetProfile.email !== "string" ||
      typeof targetAuth.user.email !== "string" ||
      targetProfile.email.toLowerCase() !== targetAuth.user.email.toLowerCase()
    ) {
      return response(409, {
        error: "The profile email does not match its authentication account. Resolve the mismatch before deleting.",
      });
    }
    if (targetAuth.user.email.toLowerCase() !== confirmEmail.toLowerCase()) {
      return response(400, { error: "The confirmation email does not match the selected account." });
    }

    await assertNoVersionedObjects(admin, userId);
    await removeOwnedObjects(admin, userId);

    const { data: latestCallerProfile, error: latestCallerProfileError } = await admin
      .from("users")
      .select("role")
      .eq("id", callerId)
      .maybeSingle();
    if (latestCallerProfileError) {
      throw new Error(
        `Could not re-verify administrator authorization: ${latestCallerProfileError.message}`,
      );
    }
    if (latestCallerProfile?.role !== "super_admin") {
      return response(403, { error: "Super Admin access was removed before deletion completed." });
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
    if (deleteError) {
      console.error("Supabase Admin API rejected user deletion:", deleteError);
      const { data: remainingAuth, error: verificationError } = await admin.auth.admin.getUserById(userId);
      if (verificationError?.status !== 404 && (verificationError || remainingAuth.user)) {
        return response(409, {
          error: `Supabase Auth rejected the deletion: ${deleteError.message}. The account still exists.`,
        });
      }
    }

    const { data: remainingAuth, error: authVerificationError } = await admin.auth.admin.getUserById(userId);
    if (!authVerificationError || authVerificationError.status !== 404 || remainingAuth?.user) {
      const detail = authVerificationError
        ? authVerificationError.message
        : "Supabase Auth still returned the user.";
      throw new Error(`Authentication deletion could not be confirmed: ${detail}`);
    }

    const { data: remainingProfile, error: profileVerificationError } = await admin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (profileVerificationError) {
      throw new Error(
        `The Auth account is deleted, but profile removal could not be verified: ${profileVerificationError.message}`,
      );
    }
    if (remainingProfile) {
      throw new Error("The Auth account is deleted, but its application profile still exists.");
    }

    return response(200, { deleted: true, userId });
  } catch (error) {
    console.error("Admin user deletion failed:", error);
    return response(500, { error: errorMessage(error) });
  }
}

Deno.serve(handleRequest);
