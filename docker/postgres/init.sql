-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test database
CREATE DATABASE finsync_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE finsync TO postgres;
GRANT ALL PRIVILEGES ON DATABASE finsync_test TO postgres;