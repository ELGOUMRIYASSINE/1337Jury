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