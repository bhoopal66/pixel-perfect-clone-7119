-- Create helper functions for new roles
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'supervisor')
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'coordinator')
$$;

-- Function to check if user has admin-level privileges (super_admin or admin)
CREATE OR REPLACE FUNCTION public.has_admin_privileges()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
$$;

-- Update the get_all_users_with_roles function to work with new roles
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(user_id uuid, email text, full_name text, role text, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    COALESCE(ur.role::text, 'user') as role,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE public.has_admin_privileges()
  ORDER BY 
    CASE ur.role 
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supervisor' THEN 3
      WHEN 'coordinator' THEN 4
      ELSE 5
    END,
    p.created_at DESC;
$$;

-- Update the update_user_role function for new role hierarchy
CREATE OR REPLACE FUNCTION public.update_user_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller has admin privileges
  IF NOT public.has_admin_privileges() THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Prevent non-super_admins from creating super_admins
  IF _role = 'super_admin' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can assign super admin role';
  END IF;
  
  -- Update or insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET role = _role;
  
  -- Delete other roles for this user (single role per user)
  DELETE FROM public.user_roles 
  WHERE user_id = _user_id AND role != _role;
  
  RETURN true;
END;
$$;