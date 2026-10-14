-- PrimeAuto: schéma initial pour Supabase (PostgreSQL).
-- Les comptes et mots de passe sont gérés par Supabase Auth.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  role text not null default 'employe' check (role in ('gestionnaire', 'employe')),
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  kilometrage integer not null default 0 check (kilometrage >= 0),
  statut text not null default 'ok' check (statut in ('ok', 'entretien', 'panne')),
  derniere_revision date,
  created_at timestamptz not null default now()
);

create table public.maintenances (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  description text not null,
  date_prevue date not null,
  date_effectuee date,
  cout numeric(12, 2) not null default 0 check (cout >= 0),
  statut text not null default 'a_venir' check (statut in ('a_venir', 'en_retard', 'fait')),
  created_at timestamptz not null default now()
);

create table public.revenues (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete set null,
  montant numeric(12, 2) not null check (montant >= 0),
  type text not null check (type in ('recette', 'depense')),
  description text,
  date_transaction date not null default current_date,
  created_at timestamptz not null default now()
);

-- Fonction SECURITY DEFINER pour consulter le rôle sans récursion RLS sur profiles.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles as p where p.id = (select auth.uid())
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

-- Crée un profil employé pour chaque nouvel utilisateur Auth.
-- Le rôle fourni dans les métadonnées d'inscription est volontairement ignoré.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nom, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nom', ''), split_part(new.email, '@', 1)),
    'employe'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.maintenances enable row level security;
alter table public.revenues enable row level security;

-- Profils: un employé voit son profil; un gestionnaire peut tout gérer.
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.current_user_role()) = 'gestionnaire');
create policy "profiles_insert_manager"
  on public.profiles for insert to authenticated
  with check ((select public.current_user_role()) = 'gestionnaire');
create policy "profiles_update_manager"
  on public.profiles for update to authenticated
  using ((select public.current_user_role()) = 'gestionnaire')
  with check ((select public.current_user_role()) = 'gestionnaire');
create policy "profiles_delete_manager"
  on public.profiles for delete to authenticated
  using ((select public.current_user_role()) = 'gestionnaire');

-- Véhicules: lecture pour les deux rôles, écriture complète gestionnaire.
create policy "vehicles_select_authenticated"
  on public.vehicles for select to authenticated using (true);
create policy "vehicles_insert_manager"
  on public.vehicles for insert to authenticated
  with check ((select public.current_user_role()) = 'gestionnaire');
create policy "vehicles_update_manager"
  on public.vehicles for update to authenticated
  using ((select public.current_user_role()) = 'gestionnaire')
  with check ((select public.current_user_role()) = 'gestionnaire');
create policy "vehicles_delete_manager"
  on public.vehicles for delete to authenticated
  using ((select public.current_user_role()) = 'gestionnaire');

-- Entretiens: les employés peuvent lire et ajouter; seul le gestionnaire modifie/supprime.
create policy "maintenances_select_authenticated"
  on public.maintenances for select to authenticated using (true);
create policy "maintenances_insert_authenticated"
  on public.maintenances for insert to authenticated
  with check ((select public.current_user_role()) in ('gestionnaire', 'employe'));
create policy "maintenances_update_manager"
  on public.maintenances for update to authenticated
  using ((select public.current_user_role()) = 'gestionnaire')
  with check ((select public.current_user_role()) = 'gestionnaire');
create policy "maintenances_delete_manager"
  on public.maintenances for delete to authenticated
  using ((select public.current_user_role()) = 'gestionnaire');

-- Revenus: les employés peuvent lire et ajouter; seul le gestionnaire modifie/supprime.
create policy "revenues_select_authenticated"
  on public.revenues for select to authenticated using (true);
create policy "revenues_insert_authenticated"
  on public.revenues for insert to authenticated
  with check ((select public.current_user_role()) in ('gestionnaire', 'employe'));
create policy "revenues_update_manager"
  on public.revenues for update to authenticated
  using ((select public.current_user_role()) = 'gestionnaire')
  with check ((select public.current_user_role()) = 'gestionnaire');
create policy "revenues_delete_manager"
  on public.revenues for delete to authenticated
  using ((select public.current_user_role()) = 'gestionnaire');

-- Les autorisations SQL complètent RLS; aucun accès anonyme n'est accordé.
revoke all on public.profiles, public.vehicles, public.maintenances, public.revenues from anon;
grant select, insert, update, delete on public.profiles, public.vehicles, public.maintenances, public.revenues to authenticated;
