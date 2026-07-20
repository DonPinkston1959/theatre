-- Track aggregate daily activity and make spreadsheet replacement transactional.
create table if not exists public.daily_visits (
  visit_date date primary key default ((now() at time zone 'America/Chicago')::date),
  visits bigint not null default 0 check (visits >= 0),
  updated_at timestamptz not null default now()
);

alter table public.daily_visits enable row level security;

grant select on table public.daily_visits to anon, authenticated;

create policy "Anyone can read aggregate visits"
  on public.daily_visits
  for select
  to anon, authenticated
  using (true);

create or replace function public.record_daily_visit()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.daily_visits (visit_date, visits)
  values ((now() at time zone 'America/Chicago')::date, 1)
  on conflict (visit_date)
  do update set
    visits = public.daily_visits.visits + 1,
    updated_at = now();
$$;

revoke all on function public.record_daily_visit() from public;
grant execute on function public.record_daily_visit() to anon, authenticated;

create or replace function public.replace_events(new_events jsonb)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count bigint;
begin
  if jsonb_typeof(new_events) <> 'array' or jsonb_array_length(new_events) = 0 then
    raise exception 'A non-empty event array is required';
  end if;

  delete from public.events;

  insert into public.events (
    title,
    theatre_name,
    event_type,
    date,
    time,
    description,
    website_url,
    ticket_url,
    venue,
    price,
    sign_language_interpreting
  )
  select
    event.title,
    event.theatre_name,
    event.event_type,
    event.date,
    event.time,
    event.description,
    event.website_url,
    event.ticket_url,
    event.venue,
    event.price,
    coalesce(event.sign_language_interpreting, false)
  from jsonb_to_recordset(new_events) as event (
    title text,
    theatre_name text,
    event_type text,
    date date,
    time time,
    description text,
    website_url text,
    ticket_url text,
    venue text,
    price text,
    sign_language_interpreting boolean
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.replace_events(jsonb) from public;
grant execute on function public.replace_events(jsonb) to anon, authenticated;
