-- 013_messaging.sql
-- Private 1:1 conversations between approved role pairs.
-- Allowed kinds: student↔supervisor, admin↔student, admin↔supervisor.
-- Student↔student is impossible because no kind permits it.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind conversation_kind not null,
  -- Sorted pair so the unique constraint catches both orderings.
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- least() is immutable so it works inside an expression unique index.
  unique (kind, participant_a, participant_b),
  check (participant_a < participant_b)
);

create index idx_conversations_a on public.conversations(participant_a);
create index idx_conversations_b on public.conversations(participant_b);

alter table public.conversations enable row level security;

create policy conversations_select on public.conversations
  for select using (
    public.is_self(participant_a)
    or public.is_self(participant_b)
    or public.is_admin()
  );

-- Insert: the caller must be one of the participants AND the kind must
-- match the role pairing (validated by trigger below).
create policy conversations_insert on public.conversations
  for insert with check (
    public.is_self(participant_a) or public.is_self(participant_b) or public.is_admin()
  );

create policy conversations_delete on public.conversations
  for delete using (public.is_admin());

create or replace function public.validate_conversation_pair()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_a user_role;
  v_role_b user_role;
begin
  -- Use `var := (SELECT …)` assignment style — see note in 007.
  v_role_a := (select role from public.profiles where id = new.participant_a);
  v_role_b := (select role from public.profiles where id = new.participant_b);

  if v_role_a is null or v_role_b is null then
    raise exception 'conversation references missing profile';
  end if;

  -- Validate the kind/role pairing.
  if new.kind = 'student_supervisor' then
    if not ((v_role_a = 'student' and v_role_b = 'supervisor')
         or (v_role_a = 'supervisor' and v_role_b = 'student')) then
      raise exception 'student_supervisor conversation requires one student + one supervisor';
    end if;
    -- The supervisor must be assigned to that student.
    declare s uuid; sup uuid;
    begin
      if v_role_a = 'student' then s := new.participant_a; sup := new.participant_b;
      else s := new.participant_b; sup := new.participant_a; end if;
      if not exists (
        select 1 from public.student_supervisor_assignments
        where student_id = s and supervisor_id = sup
      ) then
        raise exception 'supervisor not assigned to this student';
      end if;
    end;
  elsif new.kind = 'admin_student' then
    if not ((v_role_a = 'admin' and v_role_b = 'student')
         or (v_role_a = 'student' and v_role_b = 'admin')) then
      raise exception 'admin_student conversation requires admin + student';
    end if;
  elsif new.kind = 'admin_supervisor' then
    if not ((v_role_a = 'admin' and v_role_b = 'supervisor')
         or (v_role_a = 'supervisor' and v_role_b = 'admin')) then
      raise exception 'admin_supervisor conversation requires admin + supervisor';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_validate_conversation
  before insert on public.conversations
  for each row execute function public.validate_conversation_pair();

-- ── Messages ────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

create policy messages_select on public.messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (public.is_self(c.participant_a) or public.is_self(c.participant_b))
    )
  );

create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (public.is_self(c.participant_a) or public.is_self(c.participant_b) or public.is_admin())
    )
  );

create policy messages_update_read on public.messages
  for update using (
    -- Recipient (the other participant) can stamp read_at.
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (public.is_self(c.participant_a) or public.is_self(c.participant_b))
    )
  );

create policy messages_delete on public.messages
  for delete using (public.is_admin());
