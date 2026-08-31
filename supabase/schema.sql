-- Money Guru — installation de la base de synchronisation.
-- À coller une seule fois dans l'éditeur SQL du projet Supabase.
--
-- Le principe : une ligne par personne, le profil entier dans une colonne JSON.
-- Aucun calcul n'est fait côté serveur — tout reste dans le navigateur — donc
-- rien ne justifierait de découper le profil en tables. La base ne sert qu'à
-- transporter la même copie d'un appareil à l'autre.

create table if not exists public.profils (
  utilisateur uuid primary key references auth.users (id) on delete cascade,
  donnees jsonb not null,
  maj_le timestamptz not null default now(),
  cree_le timestamptz not null default now()
);

comment on table public.profils is
  'Copie synchronisée du profil financier, une ligne par compte.';
comment on column public.profils.donnees is
  'Le profil complet, tel que le navigateur le manipule.';
comment on column public.profils.maj_le is
  'Miroir lisible de donnees->>majLe : c''est lui qui tranche entre deux appareils.';

-- Sans ceci, la clé publique du client donnerait accès à toutes les lignes.
alter table public.profils enable row level security;

drop policy if exists "chacun lit sa ligne" on public.profils;
create policy "chacun lit sa ligne" on public.profils
  for select using (auth.uid() = utilisateur);

drop policy if exists "chacun crée sa ligne" on public.profils;
create policy "chacun crée sa ligne" on public.profils
  for insert with check (auth.uid() = utilisateur);

drop policy if exists "chacun modifie sa ligne" on public.profils;
create policy "chacun modifie sa ligne" on public.profils
  for update using (auth.uid() = utilisateur) with check (auth.uid() = utilisateur);

drop policy if exists "chacun supprime sa ligne" on public.profils;
create policy "chacun supprime sa ligne" on public.profils
  for delete using (auth.uid() = utilisateur);
