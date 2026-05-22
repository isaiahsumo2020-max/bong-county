 ============================================================
--  ENUMS
-- ============================================================

create type contributor_kind as enum (
  'individual',
  'organization',
  'ngo',
  'university',
  'vocational_training_center',
  'high_school',
  'media_institution',
  'government_institution',
  'healthcare_institution',
  'community_group',
  'business',
  'other'
);

create type individual_category as enum (
  'student',
  'journalist',
  'writer',
  'teacher',
  'doctor',
  'researcher',
  'software_developer',
  'youth_advocate',
  'photographer',
  'designer',
  'entrepreneur',
  'volunteer',
  'activist',
  'farmer',
  'content_creator',
  'other'
);

create type profile_visibility as enum (
  'public',
  'contributors_only',
  'private'
);


-- ============================================================
--  ALTER USERS TABLE
--  Add contributor classification fields
-- ============================================================

alter table users
add column contributor_kind contributor_kind,
add column individual_category individual_category,
add column organization_name text,
add column organization_description text,
add column institution_type text,
add column website_url text,
add column logo_url text,
add column profile_visibility profile_visibility default 'public';

-- ============================================================
--  INDEXES for new fields
-- ============================================================

create index idx_users_contributor_kind on users(contributor_kind);
create index idx_users_organization_name on users(organization_name);
create index idx_users_profile_visibility on users(profile_visibility);


-- ============================================================
--  COMMENTS FOR DOCUMENTATION
-- ============================================================

comment on column users.contributor_kind is 'Type of contributor: individual, organization, ngo, etc.';
comment on column users.individual_category is 'If contributor_kind is individual, their specific category';
comment on column users.organization_name is 'Name of organization (if not individual contributor)';
comment on column users.organization_description is 'Description of organization or institution';
comment on column users.institution_type is 'Type of institution (e.g., "University", "NGO", "Media")';
comment on column users.website_url is 'Organization/individual website URL';
comment on column users.logo_url is 'Organization/institution logo URL';
comment on column users.profile_visibility is 'Whether profile is public, contributors only, or private';
