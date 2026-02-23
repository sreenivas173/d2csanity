BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE dict_generic';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;  -- \/

CREATE TABLE dict_generic (
	dict_name varchar(1000) NULL,
	source_description varchar(1000) NULL,
	source_value varchar(1000) NULL,
	target_value varchar(1000) NULL,
	target_attribute varchar(1000) NULL
) -- \/