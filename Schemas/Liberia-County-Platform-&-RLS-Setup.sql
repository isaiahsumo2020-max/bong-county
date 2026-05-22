--  LIBERIA COUNTIES DIGITAL PLATFORM
--  Supabase PostgreSQL Schema + Row Level Security (RLS)
--  
--  Run this entire file in your Supabase SQL Editor:
--  Dashboard → SQL Editor → New Query → Paste → Run

--  EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

--  ENUMS  (controlled value lists)

do $$ begin
  create type user_role as enum (
    'super_admin',   
   'county_admin',
   'contributor',   
   'visitor'        
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type county_status as enum (
    'live',           
    'coming_soon',  
    'draft'     
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type content_type as enum (
    'story',
    'announcement',
    'article'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type content_status as enum (
    'draft',
    'pending_review',
    'published',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type opportunity_type as enum (
    'scholarship',
    'internship',
    'training',
    'fellowship',
    'grant',
    'job'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type opportunity_status as enum (
    'open',
    'closing_soon',
    'closed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type event_status as enum (
    'upcoming',
    'ongoing',
    'past',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type leader_category as enum (
    'current',
    'historical',
    'traditional',
    'past'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type notification_type as enum (
    'content_approved',
    'content_rejected',
    'content_submitted',
    'welcome',
    'announcement'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type analytics_event as enum (
    'page_view',
    'content_view',
    'opportunity_view',
    'search'
  );
exception when duplicate_object then null;
end $$;

--  TABLE: counties
--  The master table — every other table links back to this
create table if not exists counties (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique,
  slug            text not null unique,       -- e.g. "bong-county" → used in URLs
  region          text,                        -- e.g. "North Central"
  capital         text,                        -- e.g. "Gbarnga"
  status          county_status not null default 'coming_soon',
  tagline         text,                        -- e.g. "The Heartbeat of Liberia"
  description     text,
  population      text,
  area_km2        text,
  established     text,                        -- e.g. "1964"
  districts_count integer default 0,
  primary_color   text default '#1B5E35',      -- for county branding
  cover_image_url text,
  coat_of_arms_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Trigger to auto-update updated_at on any change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists counties_updated_at on counties;
create trigger counties_updated_at
  before update on counties
  for each row execute function update_updated_at();
