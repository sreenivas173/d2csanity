BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE sdb_countries';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;  -- \/

CREATE TABLE sdb_countries 
AS
SELECT obj.object_id, obj.parent_id, obj.name, 'country' as type, CAST(null AS varchar(10)) as parent_basetype
FROM nc_objects obj
where obj.object_type_id = 1102872989013434274 
  and obj.project_id+0 = 9152709697713933490 AND obj.object_id= 9152710516613933804
 -- \/

