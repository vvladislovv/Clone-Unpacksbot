-- Initial database setup for Unpacker Clone

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SELLER', 'BLOGGER', 'MANAGER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'REFERRAL', 'CAMPAIGN_PAYMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create initial settings
INSERT INTO settings (id, referral_commission, platform_commission, min_withdrawal_amount, max_withdrawal_amount)
VALUES (
    uuid_generate_v4(),
    0.5,  -- 50% referral commission
    0.1,  -- 10% platform commission
    100,  -- 100 RUB minimum withdrawal
    100000, -- 100,000 RUB maximum withdrawal
    false, -- maintenance_mode
    true   -- registration_enabled
) ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by_id ON users(referred_by_id);

CREATE INDEX IF NOT EXISTS idx_products_wb_article ON products(wb_article);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_product_id ON campaigns(product_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('russian', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_campaigns_search ON campaigns USING gin(to_tsvector('russian', title || ' ' || COALESCE(description, '')));

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ language 'plpgsql';

-- Insert initial admin user
INSERT INTO users (
    id,
    username,
    email,
    first_name,
    last_name,
    password_hash,
    role,
    is_active,
    is_verified,
    balance,
    referral_code
) VALUES (
    uuid_generate_v4(),
    'admin',
    'admin@unpacker-clone.com',
    'System',
    'Administrator',
    crypt('admin123', gen_salt('bf')),
    'ADMIN',
    true,
    true,
    0,
    generate_referral_code()
) ON CONFLICT (email) DO NOTHING;

-- Sample categories will be managed through the application

-- Create views for analytics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.role,
    u.balance,
    u.created_at as registered_at,
    COUNT(DISTINCT r.id) as referral_count,
    COUNT(DISTINCT c.id) as campaign_count,
    COUNT(DISTINCT p.id) as product_count,
    COALESCE(SUM(CASE WHEN t.type = 'REFERRAL' AND t.status = 'COMPLETED' THEN t.amount ELSE 0 END), 0) as total_referral_earnings
FROM users u
LEFT JOIN users r ON r.referred_by_id = u.id
LEFT JOIN campaigns c ON c.advertiser_id = u.id
LEFT JOIN products p ON p.seller_id = u.id
LEFT JOIN transactions t ON t.user_id = u.id
GROUP BY u.id, u.first_name, u.last_name, u.role, u.balance, u.created_at;

CREATE OR REPLACE VIEW campaign_stats AS
SELECT 
    c.id,
    c.title,
    c.type,
    c.status,
    c.budget,
    c.price_per_click,
    c.current_clicks,
    c.max_clicks,
    c.created_at,
    u.first_name || ' ' || COALESCE(u.last_name, '') as advertiser_name,
    CASE 
        WHEN c.type = 'product' THEN p.title
        WHEN c.type = 'channel' THEN ch.name
        ELSE 'Unknown'
    END as target_name,
    (c.current_clicks * c.price_per_click) as total_spent
FROM campaigns c
JOIN users u ON u.id = c.advertiser_id
LEFT JOIN products p ON p.id = c.product_id
LEFT JOIN channels ch ON ch.id = c.channel_id;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO unpacker_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO unpacker_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO unpacker_user;
