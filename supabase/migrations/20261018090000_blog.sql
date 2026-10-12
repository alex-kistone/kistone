-- Blog (Ressources du site) : articles rédigés avec l'aide de l'IA depuis l'administration.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  content text not null default '',            -- Markdown
  seo_title text not null default '',
  seo_description text not null default '',
  tags text[] not null default '{}',
  faq jsonb not null default '[]'::jsonb,      -- [{ "q": "...", "a": "..." }]
  vertical text check (vertical in ('rpo', 'drh', 'cfo', 'coo', 'cro', 'cto', 'cpo', 'cdo')),
  cover_url text,
  cover_alt text not null default '',
  -- Brief donné à l'IA (thème, ton, objectif…), gardé pour régénérer
  brief jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on public.blog_posts (published_at desc) where status = 'published';

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute function public.update_updated_at_column();

alter table public.blog_posts enable row level security;

drop policy if exists "Articles publiés lisibles par tous" on public.blog_posts;
create policy "Articles publiés lisibles par tous" on public.blog_posts
  for select using (status = 'published');

drop policy if exists "Admins gèrent les articles" on public.blog_posts;
create policy "Admins gèrent les articles" on public.blog_posts
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

-- Images d'illustration : lecture publique, écriture réservée aux admins
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Images du blog lisibles par tous" on storage.objects;
create policy "Images du blog lisibles par tous" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "Admins gèrent les images du blog" on storage.objects;
create policy "Admins gèrent les images du blog" on storage.objects
  for all using (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'blog-images' and public.has_role(auth.uid(), 'admin'));
