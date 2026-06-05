-- Public CDN bucket for mobile pack cover art (WebP).
-- Upload assets via: node scripts/uploadPackCoversToSupabase.mjs

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pack-covers',
  'pack-covers',
  true,
  524288,
  array['image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for pack cover objects
drop policy if exists "pack_covers_public_read" on storage.objects;
create policy "pack_covers_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'pack-covers');
