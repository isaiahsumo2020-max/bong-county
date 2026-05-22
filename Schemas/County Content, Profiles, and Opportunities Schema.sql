--  TABLE: users  (extends Supabase auth.users)
--  Supabase Auth handles passwords & sessions automatically.
--  This table stores the extra profile info we need.
create table if not exists users (
  id              uuid primary key references auth.users(id) on delete cascade,
  county_id       uuid references counties(id) on delete set null,
  full_name       text not null,
  email           text not null unique,
  role            user_role not null default 'contributor',
  bio             text,
  avatar_url      text,
  verified        boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists users_updated_at on users;
create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

-- Index for fast county-based user lookups
drop index if exists idx_users_county_id;
create index idx_users_county_id on users(county_id);
drop index if exists idx_users_role;
create index idx_users_role on users(role);

--  TABLE: content
--  Handles stories, announcements, and articles
--  All go through the approval workflow via status field
create table if not exists content (
  id              uuid primary key default uuid_generate_v4(),
  county_id       uuid not null references counties(id) on delete cascade,
  author_id       uuid not null references users(id) on delete cascade,
  reviewed_by     uuid references users(id) on delete set null, 
  type            content_type not null default 'story',
  title           text not null,
  body            text not null,
  excerpt         text,                    
  cover_image_url text,
  status          content_status not null default 'draft',
  pinned          boolean not null default false,
  rejection_note  text,                        
  view_count      integer not null default 0,
  tags            text[] default '{}',         
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists content_updated_at on content;
create trigger content_updated_at
  before update on content
  for each row execute function update_updated_at();

drop index if exists idx_content_county_id;
create index idx_content_county_id   on content(county_id);
drop index if exists idx_content_status;
create index idx_content_status      on content(status);
drop index if exists idx_content_author_id;
create index idx_content_author_id   on content(author_id);
drop index if exists idx_content_published_at;
create index idx_content_published_at on content(published_at desc);
drop index if exists idx_content_pinned;
create index idx_content_pinned      on content(pinned) where pinned = true;


--  TABLE: leaders
--  Past & present leaders for each county
create table if not exists leaders (
  id              uuid primary key default uuid_generate_v4(),
  county_id       uuid not null references counties(id) on delete cascade,
  name            text not null,
  role            text not null,               -- e.g. "County Superintendent"
  era             text,                         -- e.g. "2024 – Present"
  bio             text,
  photo_url       text,
  category        leader_category not null default 'current',
  display_order   integer not null default 0,  -- controls sort order on page
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists leaders_updated_at on leaders;
create trigger leaders_updated_at
  before update on leaders
  for each row execute function update_updated_at();

drop index if exists idx_leaders_county_id;
create index idx_leaders_county_id on leaders(county_id);
drop index if exists idx_leaders_category;
create index idx_leaders_category  on leaders(category);


-- ============================================
--  TABLE: opportunities
--  Scholarships, internships, training programs, grants
-- =============================================
create table if not exists opportunities (
  id              uuid primary key default uuid_generate_v4(),
  county_id       uuid not null references counties(id) on delete cascade,
  author_id       uuid not null references users(id) on delete cascade,
  type            opportunity_type not null,
  title           text not null,
  description     text not null,
  deadline        date,
  status          opportunity_status not null default 'open',
  apply_url       text,
  contact_email   text,
  tags            text[] default '{}',
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists opportunities_updated_at on opportunities;
create trigger opportunities_updated_at
  before update on opportunities
  for each row execute function update_updated_at();

drop index if exists idx_opportunities_county_id;
create index idx_opportunities_county_id on opportunities(county_id);
drop index if exists idx_opportunities_status;
create index idx_opportunities_status    on opportunities(status);
drop index if exists idx_opportunities_deadline;
create index idx_opportunities_deadline  on opportunities(deadline);


-- ==========================================
--  TABLE: events
--  Community events, summits, festivals
-- ==========================================
create table if not exists events (
  id              uuid primary key default uuid_generate_v4(),
  county_id       uuid not null references counties(id) on delete cascade,
  author_id       uuid not null references users(id) on delete cascade,
  title           text not null,
  description     text,
  event_date      timestamptz not null,
  end_date        timestamptz,
  location        text,
  cover_image_url text,
  status          event_status not null default 'upcoming',
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists events_updated_at on events;
create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();

drop index if exists idx_events_county_id;
create index idx_events_county_id  on events(county_id);
drop index if exists idx_events_event_date;
create index idx_events_event_date on events(event_date);
drop index if exists idx_events_status;
create index idx_events_status     on events(status);
