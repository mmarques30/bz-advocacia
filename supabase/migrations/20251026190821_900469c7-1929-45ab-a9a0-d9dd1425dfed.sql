-- Add columns for "outro" specification fields
ALTER TABLE contact_submissions 
ADD COLUMN outro_tipo_processo text,
ADD COLUMN outro_como_conheceu text;