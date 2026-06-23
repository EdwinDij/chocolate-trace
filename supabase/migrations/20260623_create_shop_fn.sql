-- Fonction SECURITY DEFINER : tourne en tant que postgres (bypass RLS)
-- Appelée depuis le frontend via supabase.rpc()
CREATE OR REPLACE FUNCTION public.create_shop_for_user(
  p_shop_name  text,
  p_work       text,
  p_display_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.shops (name, work, plan, owner_id)
  VALUES (p_shop_name, p_work, 'gratuit', v_user_id)
  RETURNING id INTO v_shop_id;

  INSERT INTO public.shop_member (shop_id, user_id, role, display_name)
  VALUES (v_shop_id, v_user_id, 'gerant', NULLIF(p_display_name, ''));

  RETURN v_shop_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_shop_for_user TO authenticated;
