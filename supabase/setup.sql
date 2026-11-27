-- BagaSchool : base de données de l'alpha (Supabase).
-- À coller en entier dans Supabase > SQL Editor, puis « Run ». Le script peut être relancé sans risque.
--
-- Contenu :
--   invitations   codes d'invitation (inscription impossible sans code valide)
--   profils       une ligne par compte (e-mail, date d'inscription, dernière visite, version de l'app)
--   admins        comptes administrateurs (le premier compte créé le devient automatiquement)
--   donnees       données synchronisées : une ligne par compte et par collection, avec un numéro de version
--   avis          retours envoyés depuis le bouton « Donner mon avis »
-- RGPD : les élèves, les évaluations (résultats) et l'appel ne sont jamais envoyés ; la base les refuse.

create extension if not exists pgcrypto with schema extensions;

-- ---------- tables ----------
create table if not exists public.invitations (
  code text primary key,
  note text not null default '',
  max_utilisations int not null default 1 check (max_utilisations > 0),
  utilisations int not null default 0,
  expire_le timestamptz,
  revoquee boolean not null default false,
  cree_le timestamptz not null default now()
);

create table if not exists public.profils (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  invitation text,
  cree_le timestamptz not null default now(),
  vu_le timestamptz,
  version_app text
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists public.donnees (
  user_id uuid not null references auth.users (id) on delete cascade,
  coll text not null check (coll in ('edt', 'programmations', 'fiches', 'reglages', 'journal', 'modeles', 'decks', 'devoirs', 'cahier', 'remplacements')),
  version int not null default 1,
  data jsonb not null,
  maj_le timestamptz not null default now(),
  primary key (user_id, coll),
  constraint taille_max check (octet_length(data::text) < 8000000)
);

create table if not exists public.avis (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  message text not null check (length(message) between 1 and 5000),
  page text check (length(page) < 200),
  version_app text check (length(version_app) < 40),
  appareil text check (length(appareil) < 400),
  traite boolean not null default false,
  cree_le timestamptz not null default now()
);

-- ---------- fonctions utilitaires ----------
create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Vérifie un code avant l'inscription (message clair pour l'utilisatrice). Le contrôle qui compte est le trigger plus bas.
create or replace function public.invitation_valide(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invitations
    where code = upper(trim(p_code)) and not revoquee and utilisations < max_utilisations
      and (expire_le is null or expire_le > now())
  );
$$;

-- ---------- inscription : code obligatoire ----------
create or replace function public.verifier_invitation() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invitation', '')));
  inv public.invitations;
begin
  select * into inv from public.invitations where code = c for update;
  if not found or inv.revoquee or inv.utilisations >= inv.max_utilisations
     or (inv.expire_le is not null and inv.expire_le < now()) then
    raise exception 'INVITATION_INVALIDE';
  end if;
  update public.invitations set utilisations = utilisations + 1 where code = c;
  return new;
end $$;

create or replace function public.creer_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profils (user_id, email, invitation)
  values (new.id, coalesce(new.email, ''), upper(trim(coalesce(new.raw_user_meta_data ->> 'invitation', ''))))
  on conflict (user_id) do nothing;
  -- Le tout premier compte devient administrateur.
  insert into public.admins (user_id) select new.id where not exists (select 1 from public.admins);
  return new;
end $$;

drop trigger if exists bagaschool_invitation on auth.users;
create trigger bagaschool_invitation before insert on auth.users
  for each row execute function public.verifier_invitation();
drop trigger if exists bagaschool_profil on auth.users;
create trigger bagaschool_profil after insert on auth.users
  for each row execute function public.creer_profil();

-- ---------- synchronisation ----------
-- Écrit une collection si la version de départ est la bonne ; sinon renvoie la version actuelle pour fusion.
create or replace function public.ecrire(p_coll text, p_base int, p_data jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid();
  cur record;
begin
  if uid is null then raise exception 'NON_CONNECTE'; end if;
  select version, data into cur from public.donnees where user_id = uid and coll = p_coll for update;
  if not found then
    if coalesce(p_base, 0) <> 0 then
      return jsonb_build_object('ok', false, 'v', 0, 'data', null);
    end if;
    insert into public.donnees (user_id, coll, version, data) values (uid, p_coll, 1, p_data)
      on conflict (user_id, coll) do nothing;
    if not found then -- un autre appareil a écrit juste avant
      select version, data into cur from public.donnees where user_id = uid and coll = p_coll;
      return jsonb_build_object('ok', false, 'v', cur.version, 'data', cur.data);
    end if;
    return jsonb_build_object('ok', true, 'v', 1);
  end if;
  if cur.version <> coalesce(p_base, 0) then
    return jsonb_build_object('ok', false, 'v', cur.version, 'data', cur.data);
  end if;
  update public.donnees set version = version + 1, data = p_data, maj_le = now()
    where user_id = uid and coll = p_coll;
  return jsonb_build_object('ok', true, 'v', cur.version + 1);
end $$;

-- Dernière visite et version de l'app (pour suivre l'alpha).
create or replace function public.je_suis_la(p_version text) returns void
language sql security definer set search_path = public as $$
  update public.profils set vu_le = now(), version_app = left(p_version, 40) where user_id = auth.uid();
$$;

-- Droit à l'effacement : supprime le compte et toutes ses données.
create or replace function public.supprimer_mon_compte() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NON_CONNECTE'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- administration ----------
create or replace function public.creer_invitations(p_nombre int, p_note text default '', p_max int default 1, p_jours int default null)
returns setof public.invitations
language plpgsql security definer set search_path = public, extensions as $$
declare i int; c text;
begin
  if not public.est_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  if p_nombre < 1 or p_nombre > 100 then raise exception 'NOMBRE_INVALIDE'; end if;
  for i in 1..p_nombre loop
    -- 8 caractères sans 0/O/1/I pour éviter les confusions
    c := 'BAGA-' || (select string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + (get_byte(b, k) % 32), 1), '')
                     from (select gen_random_bytes(8) as b) x, generate_series(0, 7) k);
    insert into public.invitations (code, note, max_utilisations, expire_le)
      values (c, coalesce(p_note, ''), greatest(1, coalesce(p_max, 1)),
              case when p_jours is null then null else now() + make_interval(days => p_jours) end);
    return query select * from public.invitations where code = c;
  end loop;
end $$;

create or replace function public.revoquer_invitation(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.est_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  update public.invitations set revoquee = true where code = p_code;
end $$;

-- Mot de passe oublié : l'admin génère un mot de passe provisoire à transmettre à la personne.
create or replace function public.reinitialiser_mot_de_passe(p_user uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare mdp text;
begin
  if not public.est_admin() then raise exception 'ADMIN_SEULEMENT'; end if;
  mdp := (select string_agg(substr('23456789abcdefghjkmnpqrstuvwxyz', 1 + (get_byte(b, k) % 31), 1), '')
          from (select gen_random_bytes(10) as b) x, generate_series(0, 9) k);
  update auth.users set encrypted_password = crypt(mdp, gen_salt('bf', 10)), updated_at = now() where id = p_user;
  return mdp;
end $$;

-- ---------- sécurité (RLS) ----------
alter table public.invitations enable row level security;
alter table public.profils enable row level security;
alter table public.admins enable row level security;
alter table public.donnees enable row level security;
alter table public.avis enable row level security;

drop policy if exists "admin lit les invitations" on public.invitations;
create policy "admin lit les invitations" on public.invitations for select to authenticated using (public.est_admin());

drop policy if exists "profil : soi ou admin" on public.profils;
create policy "profil : soi ou admin" on public.profils for select to authenticated using (user_id = auth.uid() or public.est_admin());

drop policy if exists "admin : soi" on public.admins;
create policy "admin : soi" on public.admins for select to authenticated using (user_id = auth.uid());

drop policy if exists "donnees : les siennes" on public.donnees;
create policy "donnees : les siennes" on public.donnees for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "avis : tout le monde peut écrire" on public.avis;
create policy "avis : tout le monde peut écrire" on public.avis for insert to anon, authenticated
  with check ((user_id is null or user_id = auth.uid()) and not traite);
drop policy if exists "avis : admin lit" on public.avis;
create policy "avis : admin lit" on public.avis for select to authenticated using (public.est_admin());
drop policy if exists "avis : admin marque traité" on public.avis;
create policy "avis : admin marque traité" on public.avis for update to authenticated using (public.est_admin()) with check (public.est_admin());

-- Droits des rôles de l'API
revoke all on public.invitations, public.profils, public.admins, public.donnees, public.avis from anon, authenticated;
grant select on public.invitations, public.profils, public.admins, public.donnees to authenticated;
grant insert, update, delete on public.donnees to authenticated;
grant insert on public.avis to anon, authenticated;
grant select, update (traite) on public.avis to authenticated;

revoke execute on function public.est_admin, public.invitation_valide, public.ecrire, public.je_suis_la, public.supprimer_mon_compte,
  public.creer_invitations, public.revoquer_invitation, public.reinitialiser_mot_de_passe, public.verifier_invitation, public.creer_profil from public, anon, authenticated;
grant execute on function public.invitation_valide to anon, authenticated;
grant execute on function public.est_admin, public.ecrire, public.je_suis_la, public.supprimer_mon_compte,
  public.creer_invitations, public.revoquer_invitation, public.reinitialiser_mot_de_passe to authenticated;

-- ---------- temps réel (télécommande et « une autre machine a écrit ») ----------
-- Canal privé « u:<id du compte> » : seuls les appareils du même compte peuvent l'écouter et y écrire.
drop policy if exists "bagaschool : canal du compte (lecture)" on realtime.messages;
create policy "bagaschool : canal du compte (lecture)" on realtime.messages for select to authenticated
  using ((select realtime.topic()) = 'u:' || (select auth.uid())::text);
drop policy if exists "bagaschool : canal du compte (écriture)" on realtime.messages;
create policy "bagaschool : canal du compte (écriture)" on realtime.messages for insert to authenticated
  with check ((select realtime.topic()) = 'u:' || (select auth.uid())::text);

-- ---------- premier code (pour créer le compte administrateur) ----------
insert into public.invitations (code, note)
select 'ADMIN-' || upper(encode(extensions.gen_random_bytes(4), 'hex')), 'Premier compte (administratrice)'
where not exists (select 1 from public.invitations);

select code as "Ton code pour créer le premier compte", note from public.invitations order by cree_le limit 1;
