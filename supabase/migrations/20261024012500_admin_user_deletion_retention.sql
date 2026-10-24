-- Preserve public community records and comments while removing the account profile.
ALTER TABLE public.content ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.events ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.content_comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.media ALTER COLUMN uploader_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.prepare_user_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.content
  SET author_id = NULL
  WHERE author_id = OLD.id AND status::text = 'published';

  UPDATE public.opportunities
  SET author_id = NULL
  WHERE author_id = OLD.id AND is_published IS TRUE;

  UPDATE public.events
  SET author_id = NULL
  WHERE author_id = OLD.id AND is_published IS TRUE;

  UPDATE public.comments
  SET user_id = NULL
  WHERE user_id = OLD.id;

  UPDATE public.content_comments
  SET user_id = NULL
  WHERE user_id = OLD.id;

  UPDATE public.media AS m
  SET uploader_id = NULL
  WHERE m.uploader_id = OLD.id
    AND EXISTS (
      SELECT 1
      FROM public.content AS c
      WHERE c.id = m.content_id
        AND c.status::text = 'published'
    );

  DELETE FROM public.email_queue
  WHERE recipient_id = OLD.id
     OR lower(recipient_email) = lower(OLD.email);

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prepare_user_account_deletion ON auth.users;
CREATE TRIGGER prepare_user_account_deletion
BEFORE DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.prepare_user_account_deletion();

-- The previous ALL policy allowed the browser to delete only the profile row,
-- leaving the authentication account behind. Keep admin insert/update access,
-- but require the Edge Function for deletion.
DROP POLICY IF EXISTS "Super admin manages all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can insert user profiles" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user profiles" ON public.users;

CREATE POLICY "Super admins can insert user profiles"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (get_my_role() = 'super_admin'::user_role);

CREATE POLICY "Super admins can update user profiles"
ON public.users
FOR UPDATE
TO authenticated
USING (get_my_role() = 'super_admin'::user_role)
WITH CHECK (get_my_role() = 'super_admin'::user_role);

REVOKE DELETE ON TABLE public.users FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_user_deletion_ready()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM pg_trigger AS t
      JOIN pg_class AS c ON c.oid = t.tgrelid
      JOIN pg_namespace AS n ON n.oid = c.relnamespace
      JOIN pg_proc AS p ON p.oid = t.tgfoid
      WHERE n.nspname = 'auth'
        AND c.relname = 'users'
        AND t.tgname = 'prepare_user_account_deletion'
        AND NOT t.tgisinternal
        AND p.prosecdef
    )
    AND NOT has_table_privilege('authenticated', 'public.users', 'DELETE')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'users'
        AND cmd IN ('DELETE', 'ALL')
    )
    AND (
      SELECT count(*) = 6
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'content' AND column_name = 'author_id')
          OR (table_name = 'opportunities' AND column_name = 'author_id')
          OR (table_name = 'events' AND column_name = 'author_id')
          OR (table_name = 'comments' AND column_name = 'user_id')
          OR (table_name = 'content_comments' AND column_name = 'user_id')
          OR (table_name = 'media' AND column_name = 'uploader_id')
        )
        AND is_nullable = 'YES'
    )
    AND to_regprocedure('public.admin_user_storage_objects(uuid,text,text)') IS NOT NULL
    AND to_regprocedure('public.admin_user_storage_object_is_referenced(text,text)') IS NOT NULL
    AND to_regprocedure('public.admin_user_storage_object_is_owned(uuid,text,text)') IS NOT NULL
    AND to_regprocedure('public.admin_rewrite_retained_media_references(text,text,text)') IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.admin_user_storage_objects(
  p_user_id uuid,
  p_after_bucket text DEFAULT NULL,
  p_after_name text DEFAULT NULL
)
RETURNS TABLE (
  bucket_id text,
  name text,
  is_versioned boolean,
  is_delete_marker boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    o.bucket_id,
    o.name,
    o.is_versioned,
    o.is_delete_marker
  FROM storage.objects AS o
  WHERE (o.owner_id = p_user_id::text OR o.owner = p_user_id)
    AND o.bucket_id IS NOT NULL
    AND o.name IS NOT NULL
    AND (
      p_after_bucket IS NULL
      OR (o.bucket_id, o.name) > (p_after_bucket, p_after_name)
    )
  ORDER BY o.bucket_id, o.name
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.admin_user_storage_object_is_referenced(
  p_raw_path text,
  p_encoded_path text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.content AS c
      WHERE c.status::text = 'published'
        AND (
          position(p_raw_path IN coalesce(c.cover_image_url, '')) > 0
          OR position(p_encoded_path IN coalesce(c.cover_image_url, '')) > 0
          OR position(p_raw_path IN coalesce(c.body, '')) > 0
          OR position(p_encoded_path IN coalesce(c.body, '')) > 0
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.opportunities AS op
      WHERE op.is_published IS TRUE
        AND (
          position(p_raw_path IN coalesce(op.description, '')) > 0
          OR position(p_encoded_path IN coalesce(op.description, '')) > 0
          OR position(p_raw_path IN coalesce(op.apply_url, '')) > 0
          OR position(p_encoded_path IN coalesce(op.apply_url, '')) > 0
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.events AS e
      WHERE e.is_published IS TRUE
        AND (
          position(p_raw_path IN coalesce(e.cover_image_url, '')) > 0
          OR position(p_encoded_path IN coalesce(e.cover_image_url, '')) > 0
          OR position(p_raw_path IN coalesce(e.description, '')) > 0
          OR position(p_encoded_path IN coalesce(e.description, '')) > 0
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.content_comments AS cc
      WHERE position(p_raw_path IN coalesce(cc.body, '')) > 0
         OR position(p_encoded_path IN coalesce(cc.body, '')) > 0
    )
    OR EXISTS (
      SELECT 1
      FROM public.comments AS cm
      WHERE position(p_raw_path IN coalesce(cm.body, '')) > 0
         OR position(p_encoded_path IN coalesce(cm.body, '')) > 0
    )
    OR EXISTS (
      SELECT 1
      FROM public.media AS m
      JOIN public.content AS c ON c.id = m.content_id
      WHERE c.status::text = 'published'
        AND (
          position(p_raw_path IN m.file_url) > 0
          OR position(p_encoded_path IN m.file_url) > 0
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.counties AS county
      WHERE position(p_raw_path IN coalesce(county.cover_image_url, '')) > 0
         OR position(p_encoded_path IN coalesce(county.cover_image_url, '')) > 0
         OR position(p_raw_path IN coalesce(county.coat_of_arms_url, '')) > 0
         OR position(p_encoded_path IN coalesce(county.coat_of_arms_url, '')) > 0
    )
    OR EXISTS (
      SELECT 1
      FROM public.galleries AS gallery
      WHERE position(p_raw_path IN coalesce(gallery.cover_image_url, '')) > 0
         OR position(p_encoded_path IN coalesce(gallery.cover_image_url, '')) > 0
    )
    OR EXISTS (
      SELECT 1
      FROM public.gallery_images AS gallery_image
      WHERE position(p_raw_path IN coalesce(gallery_image.image_url, '')) > 0
         OR position(p_encoded_path IN coalesce(gallery_image.image_url, '')) > 0
    )
    OR EXISTS (
      SELECT 1
      FROM public.leaders AS leader
      WHERE position(p_raw_path IN coalesce(leader.photo_url, '')) > 0
         OR position(p_encoded_path IN coalesce(leader.photo_url, '')) > 0
    )
    OR EXISTS (
      SELECT 1
      FROM public.partners AS partner
      WHERE position(p_raw_path IN coalesce(partner.logo_url, '')) > 0
         OR position(p_encoded_path IN coalesce(partner.logo_url, '')) > 0
         OR position(p_raw_path IN coalesce(partner.website_url, '')) > 0
         OR position(p_encoded_path IN coalesce(partner.website_url, '')) > 0
    )
    OR EXISTS (
      SELECT 1
      FROM public.tourism_sites AS site
      WHERE position(p_raw_path IN coalesce(site.cover_image_url, '')) > 0
         OR position(p_encoded_path IN coalesce(site.cover_image_url, '')) > 0
         OR position(p_raw_path IN coalesce(array_to_string(site.gallery_urls, ' '), '')) > 0
         OR position(p_encoded_path IN coalesce(array_to_string(site.gallery_urls, ' '), '')) > 0
    );
$$;

CREATE OR REPLACE FUNCTION public.admin_user_storage_object_is_owned(
  p_user_id uuid,
  p_bucket_id text,
  p_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM storage.objects AS o
    WHERE o.bucket_id = p_bucket_id
      AND o.name = p_name
      AND (o.owner_id = p_user_id::text OR o.owner = p_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_rewrite_retained_media_references(
  p_old_raw_path text,
  p_old_encoded_path text,
  p_new_path text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  changed_rows integer := 0;
  affected_rows integer;
BEGIN
  UPDATE public.content
  SET cover_image_url = replace(replace(cover_image_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path),
      body = replace(replace(body, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE status::text = 'published'
    AND (
      position(p_old_raw_path IN coalesce(cover_image_url, '')) > 0
      OR position(p_old_encoded_path IN coalesce(cover_image_url, '')) > 0
      OR position(p_old_raw_path IN coalesce(body, '')) > 0
      OR position(p_old_encoded_path IN coalesce(body, '')) > 0
    );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.counties
  SET cover_image_url = replace(replace(cover_image_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path),
      coat_of_arms_url = replace(replace(coat_of_arms_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE position(p_old_raw_path IN coalesce(cover_image_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(cover_image_url, '')) > 0
     OR position(p_old_raw_path IN coalesce(coat_of_arms_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(coat_of_arms_url, '')) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.galleries
  SET cover_image_url = replace(replace(cover_image_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE position(p_old_raw_path IN coalesce(cover_image_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(cover_image_url, '')) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.gallery_images
  SET image_url = replace(replace(image_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE position(p_old_raw_path IN coalesce(image_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(image_url, '')) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.leaders
  SET photo_url = replace(replace(photo_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE position(p_old_raw_path IN coalesce(photo_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(photo_url, '')) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.partners
  SET logo_url = replace(replace(logo_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path),
      website_url = replace(replace(website_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE position(p_old_raw_path IN coalesce(logo_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(logo_url, '')) > 0
     OR position(p_old_raw_path IN coalesce(website_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(website_url, '')) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.tourism_sites
  SET cover_image_url = replace(replace(cover_image_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path),
      gallery_urls = CASE
        WHEN gallery_urls IS NULL THEN NULL
        ELSE ARRAY(
          SELECT replace(replace(url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
          FROM unnest(gallery_urls) AS urls(url)
        )
      END
  WHERE position(p_old_raw_path IN coalesce(cover_image_url, '')) > 0
     OR position(p_old_encoded_path IN coalesce(cover_image_url, '')) > 0
     OR position(p_old_raw_path IN coalesce(array_to_string(gallery_urls, ' '), '')) > 0
     OR position(p_old_encoded_path IN coalesce(array_to_string(gallery_urls, ' '), '')) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.opportunities
  SET description = replace(replace(description, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path),
      apply_url = replace(replace(apply_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE is_published IS TRUE
    AND (
      position(p_old_raw_path IN coalesce(description, '')) > 0
      OR position(p_old_encoded_path IN coalesce(description, '')) > 0
      OR position(p_old_raw_path IN coalesce(apply_url, '')) > 0
      OR position(p_old_encoded_path IN coalesce(apply_url, '')) > 0
    );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.events
  SET cover_image_url = replace(replace(cover_image_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path),
      description = replace(replace(description, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE is_published IS TRUE
    AND (
      position(p_old_raw_path IN coalesce(cover_image_url, '')) > 0
      OR position(p_old_encoded_path IN coalesce(cover_image_url, '')) > 0
      OR position(p_old_raw_path IN coalesce(description, '')) > 0
      OR position(p_old_encoded_path IN coalesce(description, '')) > 0
    );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.content_comments
  SET body = replace(replace(body, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE position(p_old_raw_path IN body) > 0
     OR position(p_old_encoded_path IN body) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.comments
  SET body = replace(replace(body, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  WHERE position(p_old_raw_path IN body) > 0
     OR position(p_old_encoded_path IN body) > 0;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  UPDATE public.media AS m
  SET file_url = replace(replace(m.file_url, p_old_encoded_path, p_new_path), p_old_raw_path, p_new_path)
  FROM public.content AS c
  WHERE m.content_id = c.id
    AND c.status::text = 'published'
    AND (
      position(p_old_raw_path IN m.file_url) > 0
      OR position(p_old_encoded_path IN m.file_url) > 0
    );
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  changed_rows := changed_rows + affected_rows;

  RETURN changed_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_user_deletion_ready() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_user_storage_objects(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_user_storage_object_is_referenced(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_user_storage_object_is_owned(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_rewrite_retained_media_references(text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_user_deletion_ready() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_user_storage_objects(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_user_storage_object_is_referenced(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_user_storage_object_is_owned(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_rewrite_retained_media_references(text, text, text) TO service_role;
