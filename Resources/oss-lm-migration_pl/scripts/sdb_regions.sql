BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE sdb_regions';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;  -- \/

CREATE TABLE sdb_regions 
AS
SELECT obj.object_id, obj.object_id as parent_id, 'CBT Region' as name, 'region' as type, 'country' as parent_basetype, obj.description
FROM  nc_objects obj
WHERE obj.object_type_id = 1102872989013434274 and obj.project_id+0 = 9152709697713933490 and obj.object_id =9152710516613933804
 -- \/

