-- Optional production scheduling for Sprint 1B retention cleanup.
--
-- Review and run the retention setup migration first:
-- supabase/migrations/20260630120000_add_visit_retention_aggregation.sql
--
-- pg_cron is not enabled automatically by Onwan migrations. In Supabase,
-- enable pg_cron only after reviewing the cleanup behavior and confirming
-- production retention policy approval.

create extension if not exists pg_cron;

select cron.schedule(
  'onwan-retention-cleanup-daily',
  '17 2 * * *',
  $$select public.run_retention_cleanup();$$
);
