BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE sdb_customer_locations';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;  -- \/

CREATE TABLE sdb_customer_locations as
SELECT  no1.OBJECT_ID, name, parent_id, description
      FROM NC_OBJECTS no1
      WHERE no1.object_type_id = 4063055943013004400 /* Customer Location */
          AND no1.project_id+0 = 9152709697713933490 -- \/

