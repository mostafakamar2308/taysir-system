-- Create the application database alongside the Evolution database (academy_db).
-- Runs on first init of the postgres container by the official image.
CREATE DATABASE academy_app OWNER academy_user;