-- ============================================================
-- REPORTS / MODERATION
-- ============================================================

create table if not exists reports (
  id                  uuid primary key default uuid_generate_v4(),
  reporter_id         uuid references users(id) on delete set null,
  content_id          uuid references content(id) on delete cascade,
  reason              text not null,
  status              text default 'pending',
  created_at          timestamptz default now()
);

drop index if exists idx_reports_content_id;
create index idx_reports_content_id on reports(content_id);



-- ============================================================
-- COUNTY SETTINGS
-- One settings row per county
-- ============================================================

create table if not exists county_settings (
  id                  uuid primary key default uuid_generate_v4(),
  county_id           uuid unique not null references counties(id) on delete cascade,

  website_title       text,
  meta_description    text,

  facebook_url        text,
  instagram_url       text,
  twitter_url         text,
  youtube_url         text,

  contact_email       text,
  phone_number        text,
  address             text,

  hero_title          text,
  hero_subtitle       text,
  hero_image_url      text,

  custom_css          text,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

drop trigger if exists county_settings_updated_at on county_settings;
create trigger county_settings_updated_at
  before update on county_settings
  for each row execute function update_updated_at();

drop index if exists idx_county_settings_county_id;
create index idx_county_settings_county_id
on county_settings(county_id);



-- ============================================================
-- COUNTY STATISTICS
-- ============================================================

create table if not exists county_statistics (
  id                  uuid primary key default uuid_generate_v4(),
  county_id           uuid not null references counties(id) on delete cascade,
  title               text not null,
  value               text not null,
  icon                text,
  display_order       integer default 0,
  created_at          timestamptz default now()
);

drop index if exists idx_county_statistics_county_id;
create index idx_county_statistics_county_id
on county_statistics(county_id);



-- ============================================================
-- COUNTY PAGES
-- Dynamic pages for counties
-- ============================================================

create table if not exists county_pages (
  id                  uuid primary key default uuid_generate_v4(),
  county_id           uuid not null references counties(id) on delete cascade,

  title               text not null,
  slug                text unique not null,

  body                text,

  cover_image_url     text,

  is_published        boolean default true,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

drop trigger if exists county_pages_updated_at on county_pages;
create trigger county_pages_updated_at
  before update on county_pages
  for each row execute function update_updated_at();

drop index if exists idx_county_pages_county_id;
create index idx_county_pages_county_id
on county_pages(county_id);



-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table comments enable row level security;
alter table reactions enable row level security;
alter table bookmarks enable row level security;
alter table tourism_sites enable row level security;
alter table galleries enable row level security;
alter table gallery_images enable row level security;
alter table partners enable row level security;
alter table newsletters enable row level security;
alter table reports enable row level security;
alter table county_settings enable row level security;
alter table county_statistics enable row level security;
alter table county_pages enable row level security;



-- ============================================================
-- COMMENTS POLICIES
-- ============================================================

drop policy if exists "Public can view approved comments" on comments;
create policy "Public can view approved comments"
on comments for select
using (is_approved = true);

drop policy if exists "Authenticated users can create comments" on comments;
create policy "Authenticated users can create comments"
on comments for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own comments" on comments;
create policy "Users can update own comments"
on comments for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on comments;
create policy "Users can delete own comments"
on comments for delete
using (auth.uid() = user_id);



-- ============================================================
-- REACTIONS POLICIES
-- ============================================================

drop policy if exists "Public can view reactions" on reactions;
create policy "Public can view reactions"
on reactions for select
using (true);

drop policy if exists "Authenticated users can react" on reactions;
create policy "Authenticated users can react"
on reactions for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can remove own reactions" on reactions;
create policy "Users can remove own reactions"
on reactions for delete
using (auth.uid() = user_id);

-- BOOKMARKS POLICIES

drop policy if exists "Users view own bookmarks" on bookmarks;
create policy "Users view own bookmarks"
on bookmarks for select
using (auth.uid() = user_id);

drop policy if exists "Users create own bookmarks" on bookmarks;
create policy "Users create own bookmarks"
on bookmarks for insert
with check (auth.uid() = user_id);

drop policy if exists "Users delete own bookmarks" on bookmarks;
create policy "Users delete own bookmarks"
on bookmarks for delete
using (auth.uid() = user_id);


-- ============================================================
-- TOURISM SITES POLICIES
-- ============================================================

create policy "Public can view tourism sites"
on tourism_sites for select
using (is_published = true);

create policy "County admins manage tourism sites"
on tourism_sites for all
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

create policy "Super admin manages tourism sites"
on tourism_sites for all
using (get_my_role() = 'super_admin');



-- ============================================================
-- GALLERIES POLICIES
-- ============================================================

create policy "Public can view galleries"
on galleries for select
using (is_published = true);

create policy "Public can view gallery images"
on gallery_images for select
using (true);



-- ============================================================
-- PARTNERS POLICIES
-- ============================================================

create policy "Public can view partners"
on partners for select
using (is_published = true);



-- ============================================================
-- NEWSLETTER POLICIES
-- ============================================================

create policy "Anyone can subscribe to newsletters"
on newsletters for insert
with check (true);

create policy "Super admin manages newsletters"
on newsletters for all
using (get_my_role() = 'super_admin');



-- ============================================================
-- REPORTS POLICIES
-- ============================================================

create policy "Authenticated users can create reports"
on reports for insert
with check (auth.uid() = reporter_id);

create policy "Super admin manages reports"
on reports for all
using (get_my_role() = 'super_admin');



-- ============================================================
-- COUNTY SETTINGS POLICIES
-- ============================================================

create policy "Public can view county settings"
on county_settings for select
using (true);

create policy "Super admin manages county settings"
on county_settings for all
using (get_my_role() = 'super_admin');



-- ============================================================
-- COUNTY STATISTICS POLICIES
-- ============================================================

create policy "Public can view county statistics"
on county_statistics for select
using (true);

create policy "Super admin manages county statistics"
on county_statistics for all
using (get_my_role() = 'super_admin');



-- ============================================================
-- COUNTY PAGES POLICIES
-- ============================================================

create policy "Public can view published county pages"
on county_pages for select
using (is_published = true);

create policy "County admins manage county pages"
on county_pages for all
using (
  get_my_role() = 'county_admin'
  and county_id = get_my_county_id()
);

create policy "Super admin manages county pages"
on county_pages for all
using (get_my_role() = 'super_admin');

-- =======================================
--  SEED DATA: All 15 Counties of Liberia
--  Run this after creating the tables
-- =======================================
insert into counties (name, slug, region, capital, status, tagline, established, districts_count) values
  ('Bomi County', 'bomi-county', 'North Western', 'Tubmanburg', 'coming_soon', 'Land of Iron Hills', '1984', 4),
  ('Bong County',       'bong-county',       'North Central', 'Gbarnga',     'live',         'The Heartbeat of Liberia',    '1964', 12),
  ('Montserrado County','montserrado-county', 'North Central', 'Bensonville', 'coming_soon',  'The Heart of the Nation',     '1964', 5),
  ('Nimba County',      'nimba-county',       'North Central', 'Sanniquellie','coming_soon',  'Land of the Giants',          '1964', 6),
  ('Lofa County',       'lofa-county',        'North Western', 'Voinjama',    'coming_soon',  'Land of Abundance',           '1964', 6),
  ('Margibi County',    'margibi-county',     'North Central', 'Kakata',      'coming_soon',  'Gateway to Progress',         '1985', 4),
  ('Grand Bassa County','grand-bassa-county', 'South Central', 'Buchanan',    'coming_soon',  'Land of Opportunity',         '1964', 4),
  ('Grand Cape Mount County','grand-cape-mount-county','North Western','Robertsport','coming_soon','The Scenic Jewel', '1964', 5),
  ('Grand Gedeh County','grand-gedeh-county', 'South Eastern', 'Zwedru',      'coming_soon',  'The Land of the People',      '1964', 5),
  ('Grand Kru County',  'grand-kru-county',   'South Eastern', 'Barclayville','coming_soon',  'Rich in Culture and Sea',     '1984', 6),
  ('Maryland County',   'maryland-county',    'South Eastern', 'Harper',      'coming_soon',  'The Cape of Palms',           '1964', 5),
  ('Rivercess County',  'rivercess-county',   'South Central', 'Cestos City', 'coming_soon',  'River of Life',               '1985', 4),
  ('River Gee County',  'river-gee-county',   'South Eastern', 'Fish Town',   'coming_soon',  'Where Rivers Meet the Sea',   '2001', 5),
  ('Sinoe County',      'sinoe-county',       'South Eastern', 'Greenville',  'coming_soon',  'Pearl of the Coast',          '1964', 8),
  ('Gbarpolu County',   'gbarpolu-county',    'North Western', 'Bopolu',      'coming_soon',  'Land of Chiefs and Forest',   '2001', 6)
on conflict (slug) do nothing;


-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--  This is the core of multi-tenancy.
--  Each policy controls exactly who can read/write what.
-- ============================================================

-- Enable RLS on every table
alter table counties       enable row level security;
alter table users          enable row level security;
alter table content        enable row level security;
alter table leaders        enable row level security;
alter table opportunities  enable row level security;
alter table events         enable row level security;
alter table media          enable row level security;
alter table notifications  enable row level security;
alter table analytics      enable row level security;
alter table districts      enable row level security;


-- ============================================================
--  HELPER FUNCTION
--  Returns the current user's role — used in all RLS policies
-- ============================================================
create or replace function get_my_role()
returns user_role as $$
  select role from users where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_my_county_id()
returns uuid as $$
  select county_id from users where id = auth.uid();
$$ language sql security definer stable;


-- ============================================================
--  RLS POLICIES: counties
-- ============================================================

-- Anyone can view live counties (no login needed)
create policy "Public can view live counties"
  on counties for select
  using (status = 'live' or status = 'coming_soon');

-- Only super_admin can create/update/delete counties
create policy "Super admin manages counties"
  on counties for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');


-- ============================================================
--  RLS POLICIES: users
-- ============================================================

-- Users can view their own profile
create policy "Users can view own profile"
  on users for select
  using (id = auth.uid());

-- County admins can view contributors in their county
create policy "County admins can view their county users"
  on users for select
  using (
    get_my_role() = 'county_admin'
    and county_id = get_my_county_id()
  );

-- Super admin can see everyone
create policy "Super admin views all users"
  on users for select
  using (get_my_role() = 'super_admin');

-- Users can update their own profile (name, bio, avatar)
create policy "Users can update own profile"
  on users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Only super admin can change roles or create admin accounts
create policy "Super admin manages all users"
  on users for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

-- New users can insert their own row (triggered on signup)
create policy "New users can create own profile"
  on users for insert
  with check (id = auth.uid());


-- ============================================================
--  RLS POLICIES: content
-- ============================================================

-- Public can read published content from live counties
create policy "Public can read published content"
  on content for select
  using (status = 'published');

-- Contributors can read and create content in their county
create policy "Contributors can create content in their county"
  on content for insert
  with check (
    county_id = get_my_county_id()
    and author_id = auth.uid()
  );
create policy "Contributors can read content in their county"
  on content for select
  using (county_id = get_my_county_id());