-- BagaSchool : liens « Partager ma journée » (remplaçant, AESH, collègue).
-- À coller dans Supabase > SQL Editor, puis « Run ». Peut être relancé sans risque (aussi inclus dans setup.sql).
--
-- Chiffrement de bout en bout : l'app chiffre la journée sur l'appareil (AES-GCM). La clé est dans la
-- partie « # » du lien, que le navigateur n'envoie jamais au serveur. La base ne stocke qu'un bloc illisible,
-- la date du jour partagé et la date d'expiration. Sans le lien complet, personne (ni l'administratrice)
-- ne peut lire le contenu.

create table if not exists public.partages (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  jour date,
  contenu text not null,
  expire_le timestamptz not null,
  cree_le timestamptz not null default now(),
  constraint taille_max check (length(contenu) < 400000),
  constraint duree_max check (expire_le <= cree_le + interval '8 days')
);
create index if not exists partages_user on public.partages (user_id);
create index if not exists partages_expire on public.partages (expire_le);

-- Créer un lien (compte connecté). Renvoie l'identifiant, tiré au hasard par le serveur.
create or replace function public.creer_partage(p_contenu text, p_heures int, p_jour date default null) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_id text;
begin
  if auth.uid() is null then raise exception 'NON_CONNECTE'; end if;
  if p_heures is null or p_heures < 1 or p_heures > 192 then raise exception 'DUREE_INVALIDE'; end if;
  delete from public.partages where expire_le < now(); -- ménage : les liens expirés disparaissent
  if (select count(*) from public.partages where user_id = auth.uid()) >= 30 then raise exception 'TROP_DE_PARTAGES'; end if;
  v_id := translate(encode(gen_random_bytes(12), 'base64'), '+/', '-_');
  insert into public.partages (id, user_id, jour, contenu, expire_le)
  values (v_id, auth.uid(), p_jour, p_contenu, now() + make_interval(hours => p_heures));
  return v_id;
end $$;

-- Lire un lien (sans compte). Rien si le lien est inconnu, supprimé ou expiré.
create or replace function public.lire_partage(p_id text) returns table (contenu text, expire_le timestamptz)
language sql stable security definer set search_path = public as $$
  select p.contenu, p.expire_le from public.partages p where p.id = p_id and p.expire_le > now();
$$;

alter table public.partages enable row level security;
drop policy if exists "partages : les siens (lecture)" on public.partages;
create policy "partages : les siens (lecture)" on public.partages for select to authenticated using (user_id = auth.uid());
drop policy if exists "partages : les siens (suppression)" on public.partages;
create policy "partages : les siens (suppression)" on public.partages for delete to authenticated using (user_id = auth.uid());

revoke all on public.partages from anon, authenticated;
grant select (id, jour, expire_le, cree_le), delete on public.partages to authenticated;
revoke execute on function public.creer_partage, public.lire_partage from public, anon, authenticated;
grant execute on function public.creer_partage to authenticated;
grant execute on function public.lire_partage to anon, authenticated;
