-- Change conversation_id from uuid to text to support composite IDs
ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE text USING conversation_id::text;