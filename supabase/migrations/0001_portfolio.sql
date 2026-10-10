create schema portfolio;
revoke all on schema portfolio from public;
create function portfolio.touch() returns trigger language plpgsql as $$
begin new.updated_at=clock_timestamp(); return new; end $$;
create table portfolio.applications (
 id uuid primary key default gen_random_uuid(),
 reference text not null check (btrim(reference)<>''), name text not null check(btrim(name)<>''),
 owner text not null default '', capability text not null default 'Unclassified',
 lifecycle text not null default 'planned' check(lifecycle in ('planned','active','retiring','retired')),
 annual_cost numeric(16,2) check(annual_cost>=0), currency text check(currency ~ '^[A-Z]{3}$'),
 support_end date, renewal_on date, review_due date, reviewed_on date,
 personal_data boolean, version integer not null default 1,
 source_id text unique, source_row jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((annual_cost is null and currency is null) or (annual_cost is not null and currency is not null))
);
create unique index applications_reference on portfolio.applications(lower(reference));
create index applications_capability on portfolio.applications(capability);
create index applications_review on portfolio.applications(review_due) where lifecycle<>'retired';
create table portfolio.dependencies (
 id uuid primary key default gen_random_uuid(),
 consumer_id uuid not null references portfolio.applications(id), provider_id uuid not null references portfolio.applications(id),
 kind text not null, critical boolean not null default true, verified_on date not null, evidence text not null,
 status text not null default 'active' check(status in ('active','removed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(consumer_id,provider_id,kind), check(consumer_id<>provider_id)
);
create index dependencies_provider on portfolio.dependencies(provider_id);
create table portfolio.decisions (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references portfolio.applications(id),
 action text not null check(action in ('retain','invest','migrate','retire')),
 rationale text not null, evidence text not null, due_on date not null,
 status text not null default 'proposed' check(status in ('proposed','approved','implemented')),
 application_version integer not null, actor text not null, approved_by text, approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index decisions_application on portfolio.decisions(application_id);
create table portfolio.controls (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references portfolio.applications(id),
 kind text not null check(kind in ('security','retention')), evidence text not null check(btrim(evidence)<>''),
 reviewed_on date not null, review_due date not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(application_id,kind), check(review_due>=reviewed_on)
);
create table portfolio.activity (
 id uuid primary key default gen_random_uuid(), application_id uuid references portfolio.applications(id),
 actor text not null, action text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index activity_application on portfolio.activity(application_id,created_at);
create table portfolio.import_batches (
 id uuid primary key default gen_random_uuid(), source text not null, actor text not null,
 added integer not null, unchanged integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['applications','dependencies','decisions','controls','activity','import_batches'] loop
 execute format('create trigger touch before update on portfolio.%I for each row execute function portfolio.touch()',t);
 execute format('alter table portfolio.%I enable row level security',t);
 execute format('revoke all on portfolio.%I from public',t);
 end loop;
end $$;
create view portfolio.review_queue with (security_invoker=true) as
 select reference,name,owner,lifecycle,review_due,current_date-review_due as overdue_days,
 case when review_due is null then 'No review date' when owner='' then 'No owner' else 'Review due' end as reason
 from portfolio.applications where lifecycle<>'retired' and (review_due is null or review_due<=current_date or owner='');
create view portfolio.renewals with (security_invoker=true) as
 select reference,name,owner,renewal_on,renewal_on-current_date as days_left,annual_cost,currency
 from portfolio.applications where lifecycle<>'retired' and renewal_on<=current_date+90;
create view portfolio.lifecycle_risks with (security_invoker=true) as
 select a.reference,a.name,a.owner,a.support_end,a.support_end-current_date as days_left,
 (select count(*)::integer from portfolio.dependencies d join portfolio.applications c on c.id=d.consumer_id
 where d.provider_id=a.id and d.status='active' and c.lifecycle<>'retired') as dependent_apps
 from portfolio.applications a where a.lifecycle<>'retired' and a.support_end<=current_date+90;
create view portfolio.costs with (security_invoker=true) as
 select capability,currency,count(*)::integer as applications,sum(annual_cost) as recorded_annual_cost,
 count(*) filter(where annual_cost is null)::integer as unknown_costs
 from portfolio.applications where lifecycle<>'retired' group by capability,currency;
create view portfolio.duplicates with (security_invoker=true) as
 select capability,count(*)::integer as applications,string_agg(reference,', ' order by reference) as candidates
 from portfolio.applications where lifecycle in ('active','retiring') and capability<>'Unclassified'
 group by capability having count(*)>1;
create view portfolio.compliance with (security_invoker=true) as
 select a.reference,a.name,k.kind,
 case k.kind when 'security' then 'NZ-IPP5 / AU-APP11' else 'NZ-IPP9 / AU-APP11' end as rule,
 case when c.id is null then 'Missing evidence review' else 'Evidence review overdue' end as finding,
 c.review_due
 from portfolio.applications a cross join (values ('security'),('retention')) k(kind)
 left join portfolio.controls c on c.application_id=a.id and c.kind=k.kind
 where a.personal_data is distinct from false and (c.id is null or c.review_due<current_date);
create view portfolio.owner_workload with (security_invoker=true) as
 select coalesce(nullif(owner,''),'Unassigned') as owner,count(*)::integer as applications,
 count(*) filter(where review_due is null or review_due<=current_date)::integer as reviews_due,
 count(*) filter(where support_end<=current_date+90)::integer as support_risks
 from portfolio.applications where lifecycle<>'retired' group by owner;
create view portfolio.dependency_review with (security_invoker=true) as
 select d.id,c.reference as consumer,p.reference as provider,d.kind,d.critical,d.verified_on,
 current_date-d.verified_on as age_days,d.evidence
 from portfolio.dependencies d join portfolio.applications c on c.id=d.consumer_id
 join portfolio.applications p on p.id=d.provider_id
 where d.status='active' and (d.verified_on<current_date-90 or p.lifecycle='retired');
