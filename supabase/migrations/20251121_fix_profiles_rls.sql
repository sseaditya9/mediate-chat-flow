-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view profiles of conversation participants" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a policy that allows everyone to read profiles (needed for searching/displaying users)
CREATE POLICY "Public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Create a policy that allows users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy that allows users to insert their own profile (usually handled by triggers, but good for safety)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
