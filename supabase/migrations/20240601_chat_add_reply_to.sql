ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to);
