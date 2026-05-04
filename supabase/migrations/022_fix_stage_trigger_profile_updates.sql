-- 022_fix_stage_trigger_profile_updates.sql
-- The original stage trigger referenced NEW.student_id inside an expression
-- that also runs for profiles, where student_id does not exist. Branch before
-- touching table-specific fields so profile onboarding updates can recompute.

create or replace function public.trg_recompute_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'DELETE' then
      v_student := old.id;
    else
      v_student := new.id;
    end if;
  else
    if tg_op = 'DELETE' then
      v_student := old.student_id;
    else
      v_student := new.student_id;
    end if;
  end if;

  if v_student is not null then
    update public.profiles
       set current_stage = public.compute_stage(v_student)
     where id = v_student;
  end if;
  return null;
end;
$$;
