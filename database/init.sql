-- ==========================================
-- TaskFlow Database Schema Initialization Script
-- ==========================================
-- This script runs automatically during the database container's initial spin up.
-- It configures the schema, indexes for performance, database triggers, and initial seeds.

-- Enable UUID extension if not already enabled (needed for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if it exists (allows reproducible fresh installations)
DROP TABLE IF EXISTS tasks;

-- ----------------------------------------------------
-- Table Definition: tasks
-- ----------------------------------------------------
CREATE TABLE tasks (
    -- Use UUID primary keys instead of auto-incrementing integers for distributed scalability and safety
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    -- Restrict status values using SQL CHECK constraints to enforce database integrity
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Index Optimization
-- ----------------------------------------------------
-- Status filtering is a highly frequent operation (e.g. loading tasks on the board).
-- Creating a B-Tree index speeds up read query filters dramatically as table row count grows.
CREATE INDEX idx_tasks_status ON tasks(status);

-- ----------------------------------------------------
-- Trigger: Automatic Updated-At Modifiers
-- ----------------------------------------------------
-- Create a helper function to automatically update the updated_at timestamp to current time.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to auto-update updated_at on row modification before writing to storage
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------
-- Database Initial Seeds
-- ----------------------------------------------------
-- Seed initial records so developers have working data immediately on spin up
INSERT INTO tasks (title, description, status) VALUES
('Initialize TaskFlow Project', 'Set up folder structure and project environments.', 'completed'),
('Design API Endpoints', 'Define CRUD routes and controller logic for tasks.', 'in-progress'),
('Implement Frontend UI', 'Build components for viewing, creating, and updating tasks.', 'pending');
