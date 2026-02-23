BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE sdb_wire_centers';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;  -- \/

CREATE TABLE sdb_wire_centers 
AS
SELECT obj.object_id, obj.parent_id, obj.name, 'city' as type, 'region' as parent_basetype
FROM nc_objects  obj
 WHERE obj.parent_id = 9152710516613933804
    AND obj.object_type_id = 9152710685113934161 -- \/

