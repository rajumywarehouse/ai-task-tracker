-- AI-Powered Task Tracking System Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Departments Table
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (Responsible Person Master)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    manager_id INTEGER REFERENCES users(user_id),
    department_id INTEGER REFERENCES departments(department_id),
    role VARCHAR(50) NOT NULL CHECK (role IN ('Leader', 'Manager', 'Team Member')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    task_description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    responsible_person_id INTEGER REFERENCES users(user_id) NOT NULL,
    target_date DATE NOT NULL,
    sla_type VARCHAR(20) NOT NULL CHECK (sla_type IN ('24hrs', '48hrs', '72hrs', 'Custom')),
    sla_deadline TIMESTAMP NOT NULL,
    auto_reminder BOOLEAN DEFAULT TRUE,
    escalation_level INTEGER DEFAULT 0 CHECK (escalation_level IN (0, 1, 2)),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Delayed')),
    remarks TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id),
    completed_date TIMESTAMP,
    source VARCHAR(50) DEFAULT 'Manual' CHECK (source IN ('Manual', 'ERP', 'Email', 'WhatsApp')),
    erp_reference VARCHAR(100),
    email_reference VARCHAR(255)
);

-- Task History Table (Audit Trail)
CREATE TABLE task_history (
    history_id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    field_changed VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Comments Table
CREATE TABLE task_comments (
    comment_id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tasks_responsible ON tasks(responsible_person_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_target_date ON tasks(target_date);
CREATE INDEX idx_tasks_sla_deadline ON tasks(sla_deadline);
CREATE INDEX idx_tasks_created_date ON tasks(created_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_task_history_task ON task_history(task_id);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_updated
CREATE TRIGGER update_tasks_timestamp
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

-- Function to calculate SLA deadline
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
    created_date TIMESTAMP,
    sla_type VARCHAR,
    custom_hours INTEGER DEFAULT NULL
)
RETURNS TIMESTAMP AS $$
BEGIN
    CASE sla_type
        WHEN '24hrs' THEN
            RETURN created_date + INTERVAL '24 hours';
        WHEN '48hrs' THEN
            RETURN created_date + INTERVAL '48 hours';
        WHEN '72hrs' THEN
            RETURN created_date + INTERVAL '72 hours';
        WHEN 'Custom' THEN
            IF custom_hours IS NOT NULL THEN
                RETURN created_date + (custom_hours || ' hours')::INTERVAL;
            ELSE
                RETURN created_date + INTERVAL '24 hours';
            END IF;
        ELSE
            RETURN created_date + INTERVAL '24 hours';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample departments
INSERT INTO departments (name) VALUES 
    ('Engineering'),
    ('Sales'),
    ('Marketing'),
    ('Operations'),
    ('Finance'),
    ('HR');

-- Insert sample users (password: 'password123' hashed with bcrypt)
INSERT INTO users (name, email, phone_number, password_hash, manager_id, department_id, role) VALUES
    ('John Leader', 'john.leader@company.com', '+1234567890', '$2a$10$rZ5qYhJKLqVVqKqYqYqYqOqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq', NULL, 1, 'Leader'),
    ('Sarah Manager', 'sarah.manager@company.com', '+1234567891', '$2a$10$rZ5qYhJKLqVVqKqYqYqYqOqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq', 1, 1, 'Manager'),
    ('Mike Developer', 'mike.dev@company.com', '+1234567892', '$2a$10$rZ5qYhJKLqVVqKqYqYqYqOqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq', 2, 1, 'Team Member'),
    ('Lisa Sales', 'lisa.sales@company.com', '+1234567893', '$2a$10$rZ5qYhJKLqVVqKqYqYqYqOqYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq', 2, 2, 'Team Member');
