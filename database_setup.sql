-- Casa de Copas Database Setup
-- Run these commands in your Supabase SQL Editor

-- 1. Create unified transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sent', 'received', 'love_bonus', 'cashed_out', 'purchased')),
    paloma_amount INTEGER DEFAULT 0,
    love_amount INTEGER DEFAULT 0,
    recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recipient_username TEXT,
    tax_rate DECIMAL(5,4),
    user_cup_level TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create cashout requests table
CREATE TABLE IF NOT EXISTS cashout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    paloma_amount INTEGER NOT NULL,
    cash_amount INTEGER NOT NULL, -- Amount after tax
    tax_rate DECIMAL(5,4) NOT NULL,
    tax_amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    user_cup_level TEXT,
    notes TEXT, -- Admin notes
    processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user aliases table
CREATE TABLE IF NOT EXISTS user_aliases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alias_username TEXT UNIQUE NOT NULL, -- e.g., 'CUP333'
    actual_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Points to JPR333's user ID
    actual_username TEXT NOT NULL, -- e.g., 'JPR333'
    description TEXT, -- e.g., 'Casa de Copas official account'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_user_id ON cashout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cashout_requests_status ON cashout_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_aliases_alias ON user_aliases(alias_username);

-- 5. Enable RLS (Row Level Security) on new tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_aliases ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies

-- Transactions: Users can read their own transactions, admins can read all
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = recipient_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'JPR333')
    );

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON transactions
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'JPR333'));

-- Cashout requests: Users can read/create their own, admins can read/update all
CREATE POLICY "Users can view own cashout requests" ON cashout_requests
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'JPR333')
    );

CREATE POLICY "Users can create own cashout requests" ON cashout_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cashout requests" ON cashout_requests
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'JPR333'));

-- User aliases: Everyone can read active aliases, only admins can manage
CREATE POLICY "Anyone can view active aliases" ON user_aliases
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage aliases" ON user_aliases
    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'JPR333'));

-- 7. Insert the CUP333 -> JPR333 alias (run this after JPR333 account exists)
-- INSERT INTO user_aliases (alias_username, actual_user_id, actual_username, description, is_active)
-- SELECT 'CUP333', id, 'JPR333', 'Casa de Copas official account', true
-- FROM profiles WHERE username = 'JPR333' LIMIT 1;

-- 8. Create helper function to resolve aliases
CREATE OR REPLACE FUNCTION resolve_user_alias(username_input TEXT)
RETURNS TABLE(resolved_user_id UUID, resolved_username TEXT) AS $$
BEGIN
    -- First check if it's an alias
    RETURN QUERY
    SELECT ua.actual_user_id, ua.actual_username
    FROM user_aliases ua
    WHERE ua.alias_username = username_input AND ua.is_active = true
    LIMIT 1;
    
    -- If no alias found, check if it's a real username
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT p.id, p.username
        FROM profiles p
        WHERE p.username = username_input
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant necessary permissions
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON cashout_requests TO authenticated;
GRANT SELECT ON user_aliases TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_aliases TO authenticated; -- For admin functions

-- 10. Simple query to add CUP333 alias after JPR333 account exists:
-- INSERT INTO user_aliases (alias_username, actual_user_id, actual_username, description, is_active)
-- SELECT 'CUP333', id, 'JPR333', 'Casa de Copas official account', true
-- FROM profiles WHERE username = 'JPR333' LIMIT 1;