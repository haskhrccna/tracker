-- Migration: Add review tracking fields to records table
-- Run this in your Supabase SQL Editor if you already have the database set up
-- This migration adds the ability to track review start dates and completion status

-- Add new columns to records table
ALTER TABLE records
  ADD COLUMN IF NOT EXISTS review_start_date date,
  ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS completion_date timestamptz;

-- Update existing records to mark high-scoring ones as completed
-- This is optional - you may want to adjust the threshold or skip this
UPDATE records
SET
  completed = true,
  completion_date = created_at
WHERE
  score >= 95
  AND completed IS NULL;

-- Create index for faster queries on completion status
CREATE INDEX IF NOT EXISTS idx_records_completed ON records(student_id, completed);

-- Add a comment to the table
COMMENT ON COLUMN records.review_start_date IS 'Date when student started reviewing this surah';
COMMENT ON COLUMN records.completed IS 'Whether the student has completed memorizing this surah';
COMMENT ON COLUMN records.completion_date IS 'Date when the surah was marked as completed';
