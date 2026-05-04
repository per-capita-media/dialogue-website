-- 023_teacher_editor_enum_values.sql
-- Run this first; PostgreSQL enum values cannot be safely used elsewhere in
-- the same migration transaction in some Supabase runners.

alter type user_role add value if not exists 'teacher';
alter type user_role add value if not exists 'editor';
