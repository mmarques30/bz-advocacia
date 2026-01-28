-- Create table for granular page permissions
CREATE TABLE public.user_page_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_key text NOT NULL,
    can_access boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, page_key)
);

-- Enable RLS
ALTER TABLE public.user_page_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all page permissions"
ON public.user_page_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own page permissions"
ON public.user_page_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check page permission
CREATE OR REPLACE FUNCTION public.has_page_access(_user_id uuid, _page_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin has access to everything
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Check specific page permission
    SELECT 1 FROM public.user_page_permissions
    WHERE user_id = _user_id 
      AND page_key = _page_key 
      AND can_access = true
  )
$$;

-- Add updated_at trigger
CREATE TRIGGER update_user_page_permissions_updated_at
BEFORE UPDATE ON public.user_page_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();