-- 42Nexus Database Initialization Script
-- This file is for: YASSINE (Backend Dev 3)
-- Run this entire script in Supabase SQL Editor

-- =============================================
-- DROP EXISTING (for fresh start)
-- =============================================
DROP TABLE IF EXISTS dispute_votes CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS user_votes CASCADE;
DROP TABLE IF EXISTS vote_options CASCADE;
DROP TABLE IF EXISTS subject_votes CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS resource_votes CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS dispute_side CASCADE;
DROP TYPE IF EXISTS dispute_status CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;
DROP TYPE IF EXISTS staff_decision_type CASCADE;
DROP TYPE IF EXISTS vote_status CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================================
-- CREATE ENUM TYPES
-- =============================================
CREATE TYPE user_role AS ENUM ('student', 'staff');
CREATE TYPE resource_type AS ENUM ('documentation', 'tutorial', 'video', 'article', 'other');
CREATE TYPE vote_status AS ENUM ('open', 'resolved', 'staff_decided');
CREATE TYPE staff_decision_type AS ENUM ('allowed', 'not_allowed');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE dispute_status AS ENUM ('active', 'resolved', 'staff_decided');
CREATE TYPE dispute_side AS ENUM ('corrector', 'corrected');

-- =============================================
-- 1. USERS
-- =============================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    role user_role DEFAULT 'student',
    campus_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- 2. PROJECTS
-- =============================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_slug ON projects(slug);

-- =============================================
-- 3. RESOURCES
-- =============================================
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    resource_type resource_type DEFAULT 'other',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_resources_project ON resources(project_id);

-- =============================================
-- 4. RESOURCE VOTES
-- =============================================
CREATE TABLE resource_votes (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_upvote BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

-- =============================================
-- 5. TESTS
-- =============================================
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'python',
    downloads INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_tests_project ON tests(project_id);

-- =============================================
-- 6. SUBJECT VOTES
-- =============================================
CREATE TABLE subject_votes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question VARCHAR(500) NOT NULL,
    context TEXT,
    status vote_status DEFAULT 'open',
    staff_decision staff_decision_type,
    staff_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_subject_votes_project ON subject_votes(project_id);
CREATE INDEX idx_subject_votes_status ON subject_votes(status);

-- =============================================
-- 7. VOTE OPTIONS
-- =============================================
CREATE TABLE vote_options (
    id SERIAL PRIMARY KEY,
    subject_vote_id INTEGER NOT NULL REFERENCES subject_votes(id) ON DELETE CASCADE,
    option_text VARCHAR(300) NOT NULL
);

CREATE INDEX idx_vote_options_vote ON vote_options(subject_vote_id);

-- =============================================
-- 8. USER VOTES
-- =============================================
CREATE TABLE user_votes (
    id SERIAL PRIMARY KEY,
    subject_vote_id INTEGER NOT NULL REFERENCES subject_votes(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_vote_id, user_id)
);

-- =============================================
-- 9. DISPUTES
-- =============================================
CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    corrector_opinion TEXT NOT NULL,
    corrected_opinion TEXT NOT NULL,
    urgency urgency_level DEFAULT 'medium',
    status dispute_status DEFAULT 'active',
    winner dispute_side,
    staff_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_project ON disputes(project_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- =============================================
-- 10. DISPUTE VOTES
-- =============================================
CREATE TABLE dispute_votes (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_for dispute_side NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dispute_id, user_id)
);

-- =============================================
-- SEED DATA: Projects
-- =============================================
INSERT INTO projects (name, slug, description, order_index) VALUES
('Starting', 'starting', 'Getting started with 42', 0),
('Python Module 00', 'python-00', 'Basic syntax and data types', 1),
('Python Module 01', 'python-01', 'Objects and Classes', 2),
('Python Module 02', 'python-02', 'Data manipulation', 3),
('Python Module 03', 'python-03', 'Decorators and functions', 4),
('Python Module 04', 'python-04', 'Inheritance and polymorphism', 5),
('ft_otp', 'ft-otp', 'One-Time Password', 6),
('Django Piscine', 'django-piscine', 'Django web development', 7),
('ft_transcendence', 'ft-transcendence', 'Final project', 8);

-- =============================================
-- SEED DATA: Test Users (Development Only)
-- =============================================
INSERT INTO users (id, login, email, display_name, role) VALUES
(1, 'staff_test', 'staff@42.fr', 'Staff User', 'staff'),
(2, 'student_test', 'student@42.fr', 'Student User', 'student');

-- =============================================
-- VERIFY TABLES
-- =============================================
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
