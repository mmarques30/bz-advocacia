ALTER TABLE contact_submissions ALTER COLUMN email DROP NOT NULL;
ALTER TABLE contact_submissions ALTER COLUMN email SET DEFAULT '';