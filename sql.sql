-- ENUM Types
CREATE TYPE user_role AS ENUM ('student', 'staff');
CREATE TYPE resource_type AS ENUM ('documentation', 'tutorial', 'video', 'article', 'other');
CREATE TYPE vote_status AS ENUM ('open', 'resolved', 'staff_decided');
CREATE TYPE staff_decision_type AS ENUM ('allowed', 'not_allowed');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE dispute_status AS ENUM ('active', 'resolved', 'staff_decided');
CREATE TYPE dispute_side AS ENUM ('corrector', 'corrected');
CREATE TYPE rule_status AS ENUM ('proposed', 'voting', 'approved', 'rejected', 'expired');
CREATE TYPE rule_type AS ENUM ('function_usage', 'norm_rule', 'implementation', 'other');
CREATE TYPE comment_type AS ENUM ('subject_vote', 'dispute', 'rule');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    campus_id INTEGER,
    role user_role DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_role ON users(role);

-- Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_slug ON projects(slug);

-- Project Rules Table
CREATE TABLE project_rules (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rule_text TEXT NOT NULL,
    rule_type rule_type DEFAULT 'other',
    explanation TEXT,
    status rule_status DEFAULT 'proposed',
    proposed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    votes_required INTEGER DEFAULT 10,
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_project_rules_project ON project_rules(project_id);
CREATE INDEX idx_project_rules_status ON project_rules(status);

-- Function Rules Table
CREATE TABLE function_rules (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES project_rules(id) ON DELETE SET NULL,
    function_name VARCHAR(100) NOT NULL,
    allowed BOOLEAN NOT NULL,
    context TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, function_name)
);
CREATE INDEX idx_function_rules_project ON function_rules(project_id);

-- Subject Votes Table
CREATE TABLE subject_votes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question VARCHAR(500) NOT NULL,
    context TEXT,
    status vote_status DEFAULT 'open',
    staff_decision staff_decision_type,
    staff_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rule_id INTEGER REFERENCES project_rules(id) ON DELETE SET NULL,
    deadline TIMESTAMPTZ,
    votes_required INTEGER DEFAULT 5,
    total_votes INTEGER DEFAULT 0,
    auto_close BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_subject_votes_project ON subject_votes(project_id);
CREATE INDEX idx_subject_votes_status ON subject_votes(status);

-- Vote Options Table
CREATE TABLE vote_options (
    id SERIAL PRIMARY KEY,
    subject_vote_id INTEGER NOT NULL REFERENCES subject_votes(id) ON DELETE CASCADE,
    option_text VARCHAR(300) NOT NULL,
    votes_count INTEGER DEFAULT 0
);
CREATE INDEX idx_vote_options_vote ON vote_options(subject_vote_id);

-- User Votes Table
CREATE TABLE user_votes (
    id SERIAL PRIMARY KEY,
    subject_vote_id INTEGER NOT NULL REFERENCES subject_votes(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_vote_id, user_id)
);
CREATE INDEX idx_user_votes_vote ON user_votes(subject_vote_id);
CREATE INDEX idx_user_votes_user ON user_votes(user_id);

-- Rule Votes Table
CREATE TABLE rule_votes (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES project_rules(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_for BOOLEAN NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rule_id, user_id)
);
CREATE INDEX idx_rule_votes_rule ON rule_votes(rule_id);

-- Disputes Table
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
    correction_date TIMESTAMPTZ,
    project_version VARCHAR(50),
    evidence_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_disputes_project ON disputes(project_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Dispute Votes Table
CREATE TABLE dispute_votes (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_for dispute_side NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dispute_id, user_id)
);
CREATE INDEX idx_dispute_votes_dispute ON dispute_votes(dispute_id);

-- Staff Decisions Table
CREATE TABLE staff_decisions (
    id SERIAL PRIMARY KEY,
    subject_vote_id INTEGER REFERENCES subject_votes(id) ON DELETE CASCADE,
    dispute_id INTEGER REFERENCES disputes(id) ON DELETE CASCADE,
    staff_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision_text TEXT NOT NULL,
    decision_type staff_decision_type NOT NULL,
    overrides_votes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_reference CHECK (
        (subject_vote_id IS NOT NULL AND dispute_id IS NULL) OR
        (subject_vote_id IS NULL AND dispute_id IS NOT NULL)
    )
);
CREATE INDEX idx_staff_decisions_vote ON staff_decisions(subject_vote_id);
CREATE INDEX idx_staff_decisions_dispute ON staff_decisions(dispute_id);

-- Comments Table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    parent_type comment_type NOT NULL,
    parent_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_parent ON comments(parent_type, parent_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Comment Votes Table
CREATE TABLE comment_votes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_upvote BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);
CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);

-- Resources Table
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    resource_type resource_type DEFAULT 'other',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_resources_project ON resources(project_id);

-- Resource Votes Table
CREATE TABLE resource_votes (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_upvote BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);
CREATE INDEX idx_resource_votes_resource ON resource_votes(resource_id);

-- Tests Table
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tests_project ON tests(project_id);
