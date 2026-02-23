create table stat_write2table
SELECT * FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT ILIKE '%SELECT%'
AND query ILIKE '%transformed%'
AND query NOT ILIKE '%pg_stat_activity%';

create table stat_oldest_query as
SELECT application_name, 
       pid, 
       state,
       age(clock_timestamp(), query_start), /* How long has the query has been running in h:m:s */
       usename, 
       query /* The query text */
FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start asc;
