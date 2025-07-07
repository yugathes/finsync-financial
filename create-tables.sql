-- Create the users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  monthlyIncome DECIMAL(10,2) DEFAULT 0.00,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the commitments table
CREATE TABLE commitments (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('static', 'dynamic')),
  category VARCHAR(100) NOT NULL,
  isPaid BOOLEAN DEFAULT FALSE,
  isShared BOOLEAN DEFAULT FALSE,
  sharedWith INTEGER[], -- Array of user IDs
  dueDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_commitments_userId ON commitments(userId);
CREATE INDEX idx_commitments_createdAt ON commitments(createdAt);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow public access for demo purposes
-- Note: In production, you would want more restrictive policies
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON users FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON commitments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON commitments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON commitments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON commitments FOR DELETE USING (true);