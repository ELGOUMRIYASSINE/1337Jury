-- 1337Jury Database Initialization Script
-- This file is for: YASSINE (Backend Dev 3)
-- Run this entire script in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    ft_id INTEGER UNIQUE NOT NULL,
    login VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) DEFAULT 'other',
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resource votes
CREATE TABLE IF NOT EXISTS resource_votes (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    is_upvote BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    github_url VARCHAR(500) NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INTEGER REFERENCES users(id),
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subject votes table
CREATE TABLE IF NOT EXISTS subject_votes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'open',
    winning_option_id INTEGER,
    staff_decision_by INTEGER REFERENCES users(id),
    staff_decision_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Vote options
CREATE TABLE IF NOT EXISTS vote_options (
    id SERIAL PRIMARY KEY,
    subject_vote_id INTEGER REFERENCES subject_votes(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    vote_count INTEGER DEFAULT 0
);

-- Add FK after vote_options exists
ALTER TABLE subject_votes 
ADD CONSTRAINT fk_winning_option 
FOREIGN KEY (winning_option_id) REFERENCES vote_options(id);

-- User votes
CREATE TABLE IF NOT EXISTS user_votes (
    id SERIAL PRIMARY KEY,
    subject_vote_id INTEGER REFERENCES subject_votes(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES vote_options(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_vote_id, user_id)
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    corrector_id INTEGER REFERENCES users(id),
    corrected_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'open',
    winner VARCHAR(50),
    corrector_votes INTEGER DEFAULT 0,
    corrected_votes INTEGER DEFAULT 0,
    staff_decision_by INTEGER REFERENCES users(id),
    staff_decision_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Dispute votes
CREATE TABLE IF NOT EXISTS dispute_votes (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER REFERENCES disputes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    vote_for VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dispute_id, user_id)
);