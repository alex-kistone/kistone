
-- Add pipeline status to profile_suggestions
ALTER TABLE public.profile_suggestions 
ADD COLUMN pipeline_status TEXT NOT NULL DEFAULT 'suggested';

-- Add status updated timestamp
ALTER TABLE public.profile_suggestions 
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
