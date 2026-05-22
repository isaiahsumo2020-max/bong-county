-- ========================================
--  TABLE: media
--  All uploaded images and files — stores the URL + metadata
--  Actual files live in Supabase Storage buckets
-- =========================================
create table if not exists media (
  id              uuid primary key default uuid_generate_v4(),
  county_id       uuid not null references counties(id) on delete cascade,
  uploader_id     uuid not null references users(id) on delete cascade,
  content_id      uuid references content(id) on delete set null,
  file_url        text not null,
  file_type       text not null,               -- e.g. 'image/jpeg'
  file_name       text,
  file_size_bytes integer,
  alt_text        text,                        -- accessibility
  uploaded_at     timestamptz not null default now()
);

drop index if exists idx_media_county_id;
create index idx_media_county_id  on media(county_id);
drop index if exists idx_media_content_id;
create index idx_media_content_id on media(content_id);


-- ========================================
--  TABLE: notifications
--  In-app alerts for contributors and admins
-- ========================================
create table if not exists notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  type            notification_type not null,
  title           text not null,
  message         text not null,
  link            text,                        -- e.g. "/bong-county/stories/123"
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

drop index if exists idx_notifications_user_id;
create index idx_notifications_user_id on notifications(user_id);
drop index if exists idx_notifications_read;
create index idx_notifications_read    on notifications(read) where read = false;


-- ========================================
--  TABLE: analytics
--  Lightweight event tracking — no personal data stored
-- ========================================
create table if not exists analytics (
  id               uuid primary key default uuid_generate_v4(),
  county_id        uuid not null references counties(id) on delete cascade,
  content_id       uuid references content(id) on delete set null,
  event_type       analytics_event not null,
  visitor_country  text,                       -- from Supabase Edge headers
  referrer         text,
  created_at       timestamptz not null default now()
);

drop index if exists idx_analytics_county_id;
create index idx_analytics_county_id  on analytics(county_id);
drop index if exists idx_analytics_event_type;
create index idx_analytics_event_type on analytics(event_type);
drop index if exists idx_analytics_created_at;
create index idx_analytics_created_at on analytics(created_at desc);


-- =======================================
--  TABLE: districts
--  Administrative districts per county
-- =======================================
create table if not exists districts (
  id              uuid primary key default uuid_generate_v4(),
  county_id       uuid not null references counties(id) on delete cascade,
  name            text not null,
  description     text,
  tags            text[] default '{}',
  display_order   integer not null default 0,
  created_at      timestamptz not null default now()
);

drop index if exists idx_districts_county_id;
create index idx_districts_county_id on districts(county_id);

-- COMMENTS

create table if not exists comments (
  id              uuid primary key default uuid_generate_v4(),
  content_id      uuid not null references content(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  parent_id       uuid references comments(id) on delete cascade,
  body            text not null,
  is_approved     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists comments_updated_at on comments;
create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at();

drop index if exists idx_comments_content_id;
create index idx_comments_content_id on comments(content_id);
drop index if exists idx_comments_user_id;
create index idx_comments_user_id on comments(user_id);



-- ============================================================
-- REACTIONS (likes/hearts)
-- ============================================================

create table if not exists reactions (
  id              uuid primary key default uuid_generate_v4(),
  content_id      uuid not null references content(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  reaction_type   text not null default 'like',
  created_at      timestamptz not null default now(),

  unique(content_id, user_id, reaction_type)
);

drop index if exists idx_reactions_content_id;
create index idx_reactions_content_id on reactions(content_id);
drop index if exists idx_reactions_user_id;
create index idx_reactions_user_id on reactions(user_id);



-- ============================================================
-- BOOKMARKS
-- ============================================================

create table if not exists bookmarks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  content_id      uuid not null references content(id) on delete cascade,
  created_at      timestamptz not null default now(),

  unique(user_id, content_id)
);

drop index if exists idx_bookmarks_user_id;
create index idx_bookmarks_user_id on bookmarks(user_id);



-- ============================================================
-- TOURISM SITES
-- ============================================================

create table if not exists tourism_sites (
  id                  uuid primary key default uuid_generate_v4(),
  county_id           uuid not null references counties(id) on delete cascade,
  name                text not null,
  slug                text unique,
  description         text,
  location            text,
  cover_image_url     text,
  gallery_urls        text[] default '{}',
  category            text,
  entry_fee           text,
  opening_hours       text,
  contact_info        text,
  latitude            numeric,
  longitude           numeric,
  is_featured         boolean default false,
  is_published        boolean default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists tourism_sites_updated_at on tourism_sites;
create trigger tourism_sites_updated_at
  before update on tourism_sites
  for each row execute function update_updated_at();

drop index if exists idx_tourism_sites_county_id;
create index idx_tourism_sites_county_id on tourism_sites(county_id);
drop index if exists idx_tourism_sites_slug;
create index idx_tourism_sites_slug on tourism_sites(slug);



-- ============================================================
-- GALLERIES
-- ============================================================

create table if not exists galleries (
  id                  uuid primary key default uuid_generate_v4(),
  county_id           uuid not null references counties(id) on delete cascade,
  title               text not null,
  description         text,
  cover_image_url     text,
  is_published        boolean default true,
  created_at          timestamptz default now()
);

drop index if exists idx_galleries_county_id;
create index idx_galleries_county_id on galleries(county_id);


-- ============================================================
-- GALLERY IMAGES
-- ============================================================

create table if not exists gallery_images (
  id                  uuid primary key default uuid_generate_v4(),
  gallery_id          uuid not null references galleries(id) on delete cascade,
  image_url           text not null,
  caption             text,
  display_order       integer default 0,
  created_at          timestamptz default now()
);

drop index if exists idx_gallery_images_gallery_id;
create index idx_gallery_images_gallery_id on gallery_images(gallery_id);



-- ============================================================
-- PARTNERS
-- ============================================================

create table if not exists partners (
  id                  uuid primary key default uuid_generate_v4(),
  county_id           uuid references counties(id) on delete cascade,
  name                text not null,
  logo_url            text,
  website_url         text,
  description         text,
  category            text,
  is_published        boolean default true,
  created_at          timestamptz default now()
);

drop index if exists idx_partners_county_id;
create index idx_partners_county_id on partners(county_id);



-- ============================================================
-- NEWSLETTER SUBSCRIPTIONS
-- ============================================================

create table if not exists newsletters (
  id                  uuid primary key default uuid_generate_v4(),
  email               text unique not null,
  county_id           uuid references counties(id) on delete set null,
  subscribed_at       timestamptz default now()
);

drop index if exists idx_newsletters_county_id;
create index idx_newsletters_county_id on newsletters(county_id);

