i# 42 Community Rules and Voting System Database

## 📄 Table of Contents
1. [Introduction](#introduction)
2. [Database Overview](#database-overview)
3. [Table Details](#table-details)
    - [1. Users Table](#1-users-table)
    - [2. Projects Table](#2-projects-table)
    - [3. Subject Voting System](#3-subject-voting-system)
      - [Subject Votes](#subject-votes)
      - [Vote Options](#vote-options)
      - [User Votes](#user-votes)
    - [4. Correction Dispute System](#4-correction-dispute-system)
      - [Disputes](#disputes)
      - [Dispute Votes](#dispute-votes)
      - [Staff Decisions](#staff-decisions)
    - [5. Rules System](#5-rules-system)
      - [Project Rules](#project-rules)
      - [Function Rules](#function-rules)
      - [Rule Votes](#rule-votes)
    - [6. Discussion System](#6-discussion-system)
      - [Comments](#comments)
      - [Comment Votes](#comment-votes)
    - [7. Resources and Tests](#7-resources-and-tests)
      - [Resources](#resources)
      - [Resource Votes](#resource-votes)
      - [Tests](#tests)
4. [Key Relationships](#key-relationships)
5. [Data Flow Examples](#data-flow-examples)

---

## Introduction

This database powers a **community-driven rules, resources, and discussion system** for the 42 curriculum. It allows students and staff to:
- **Create and vote** on project-related rules
- **Resolve disputes** democratically or via staff overrides
- **Share resources** and evaluate their usefulness
- Collaborate in maintaining a fair and transparent environment.

---

## Database Overview

The database consists of 16 core tables, organized into systems:

1. **Users and Projects** tables for user accounts and curriculum structure.
2. **Subject Voting System** to report issues, vote, and create rules.
3. **Correction Dispute System** for resolving conflicts around project corrections.
4. **Rules System** for defining shared norms based on community consensus.
5. **Discussion System** to add comments and vote on them.
6. **Resources and Tests** to share and rank materials.

---

## Table Details

### 1. Users Table

#### Purpose:
Holds information about all platform users, including students and staff.

#### Columns:
- **`id`**: Unique identifier for the user.
- **`login`**: Unique username.
- **`email`**: User's email address.
- **`display_name`**: User's display name.
- **`role`**: User role (`student` or `staff`).
- **`avatar_url`**, **`campus_id`**, **timestamps**: Additional profile data.

#### Example Data:
| id  | login    | email         | display_name | role     |
| --- | -------- | ------------- | ------------ | -------- |
| 1   | johndoe  | john@42.fr    | John         | student  |

---

### 2. Projects Table

#### Purpose:
Organize content by 42 curriculum projects.

#### Columns:
- **`id`**: Unique project identifier.
- **`name`**: Project name (e.g., `libft`).
- **`slug`**: URL-safe identifier.
- **`description`** and **`order_index`**: Additional details.

#### Example Data:
| id  | name         | slug      | description           |
| --- | ------------ | --------- | --------------------- |
| 1   | libft        | libft     | Your first C library  |
| 2   | ft_printf    | ft-printf | Recreate printf       |

---

### 3. Subject Voting System

#### Subject Votes

#### Purpose:
Allows users to create issues with a **question/problem** about a project to be addressed by community voting.

#### Columns:
- **`id`**, **`project_id`**, **`user_id`**: Identifies the subject vote.
- **`question`**: The main problem/question.
- **`context`**: Explanation or PDFs.
- **`status`**: Vote status (`open`, `resolved`).
- **`deadline`**: When voting ends.

#### Example Data:
| id  | project_id | user_id | question                                                 | status  |
| --- | ---------- | ------- | -------------------------------------------------------- | ------- |
| 1   | 1          | 1       | "Can we use atoi() in libft? PDF says recreate standard" | open    |

---

#### Vote Options

#### Purpose:
Stores the potential voting choices.

#### Example:
| id  | subject_vote_id | option_text             |
| --- | --------------- | ----------------------- |
| 1   | 1               | Yes, it's allowed       |
| 2   | 1               | No, it's not allowed    |
| 3   | 1               | Needs staff clarification |

---

#### User Votes

#### Purpose:
Tracks which option each user selected in a vote.

#### Example:
| id  | subject_vote_id | user_id | option_id |
| --- | --------------- | ------- | --------- |
| 1   | 1               | 1       | 1         |

---

### 4. Correction Dispute System

#### Disputes

#### Purpose:
Tracks disagreements over a correction.

#### Example:
| id  | project_id | creator_id | description                          |
| --- | ---------- | ---------- | ------------------------------------ |
| 1   | 1          | 2          | "Corrector says no recursion allowed"|

---

#### Dispute Votes

#### Example:
Community members vote to resolve the dispute.

| id  | dispute_id | user_id | vote_for   |
| --- | ---------- | ------- | ---------- |
| 1   | 1          | 3       | corrector  |
| 2   | 1          | 4       | corrected  |

---

#### Staff Decisions

#### Example:
If a staff member intervenes:

| id  | dispute_id | staff_user_id | decision_text               |
| --- | ---------- | ------------- | --------------------------- |
| 1   | 1          | 10            | "Recursion **is allowed**." |

---

### 5. Rules System

#### Project Rules

#### Purpose:
Creates general project rules based on **approved subject votes**.

#### Example:
| id  | project_id | rule_text                   | status     |
| --- | ---------- | --------------------------- | ---------- |
| 1   | 1          | "Recursion allowed for libft" | approved  |

---

#### Function Rules

#### Purpose:
Defines if specific functions are allowed in projects.

#### Example:
| id  | function_name | allowed |
| --- | ------------- | ------- |
| 1   | atoi()        | true    |

---

#### Rule Votes

#### Example:
Community votes to approve/reject rules.

| id  | rule_id | user_id | vote_for |
| --- | ------- | ------- | -------- |
| 1   | 1       | 2       | true     |

---

### 6. Discussion System

#### Comments

#### Example:
Users can discuss on issues, disputes, or rules.

| id  | parent_type | content                 |
| --- | ----------- | ----------------------- |
| 1   | subject_vote | "I agree, please review"|

---

#### Comment Votes

#### Example:
Upvotes/downvotes for ranking comments.

| id  | comment_id | user_id | is_upvote |
| --- | ---------- | ------- | --------- |
| 1   | 1          | 3       | true      |

---

### 7. Resources and Tests

#### Resources

#### Purpose:
Shares helpful materials like tutorials or guides.

#### Example:
| id  | project_id | title          | url         |
| --- | ---------- | -------------- | ----------- |
| 1   | 1          | "Libft Guide"  | "https://.."|

---

#### Resource Votes

#### Purpose:
Ranks shared resources.

---

#### Tests

#### Purpose:
Stores test scripts for projects.

#### Example:
| id  | title          | downloads |
| --- | -------------- | --------- |
| 1   | "libft tester" | 100       |

---

## Key Relationships

- **users** → Creates **subject_votes**, **disputes**, **rules**.
- **projects** → Stores **project_rules**, **function_rules**, **tests**.
- **votes** → Tracks user input for disputes, rules, and subjects.

---

## Data Flow Examples

### Workflow 1: Subject Rule

1. User creates `subject_vote`.
2. Community votes via `user_votes` → approved!
3. New `project_rules` defined → affects all.

---

### Workflow 2: Correction Dispute

1. User creates `dispute`
2. Community or staff intervenes.
3. Resolved automatically or by staff override.

---

This README fully documents the **42 Community Voting System Database**! 🚀
