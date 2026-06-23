-- ============================================================
-- Politiques RLS complètes pour toutes les tables
-- À exécuter dans le SQL Editor du dashboard Supabase
-- ============================================================

-- SHOPS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_insert"  ON public.shops;
DROP POLICY IF EXISTS "shop_select"  ON public.shops;
DROP POLICY IF EXISTS "shop_update"  ON public.shops;
DROP POLICY IF EXISTS "shop_delete"  ON public.shops;

CREATE POLICY "shop_insert" ON public.shops
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "shop_select" ON public.shops
  FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = shops.id
    )
  );

CREATE POLICY "shop_update" ON public.shops
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "shop_delete" ON public.shops
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- SHOP_MEMBER
ALTER TABLE public.shop_member ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_insert" ON public.shop_member;
DROP POLICY IF EXISTS "member_select" ON public.shop_member;
DROP POLICY IF EXISTS "member_update" ON public.shop_member;
DROP POLICY IF EXISTS "member_delete" ON public.shop_member;

CREATE POLICY "member_insert" ON public.shop_member
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT owner_id FROM public.shops WHERE id = shop_id
    )
  );

CREATE POLICY "member_select" ON public.shop_member
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT owner_id FROM public.shops WHERE id = shop_id
    )
  );

CREATE POLICY "member_update" ON public.shop_member
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.shops WHERE id = shop_id
    )
  );

CREATE POLICY "member_delete" ON public.shop_member
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.shops WHERE id = shop_id
    )
  );

-- PRODUCTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = products.shop_id
    )
  );

CREATE POLICY "products_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = products.shop_id
    )
  );

CREATE POLICY "products_update" ON public.products
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = products.shop_id
    )
  );

CREATE POLICY "products_delete" ON public.products
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = products.shop_id
    )
  );

-- BATCHES
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "batches_insert" ON public.batches;
DROP POLICY IF EXISTS "batches_select" ON public.batches;
DROP POLICY IF EXISTS "batches_update" ON public.batches;
DROP POLICY IF EXISTS "batches_delete" ON public.batches;

CREATE POLICY "batches_select" ON public.batches
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = batches.shop_id
    )
  );

CREATE POLICY "batches_insert" ON public.batches
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = batches.shop_id
    )
  );

CREATE POLICY "batches_update" ON public.batches
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = batches.shop_id
    )
  );

CREATE POLICY "batches_delete" ON public.batches
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = batches.shop_id
    )
  );

-- HISTORIC
ALTER TABLE public.historic ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historic_insert" ON public.historic;
DROP POLICY IF EXISTS "historic_select" ON public.historic;

CREATE POLICY "historic_select" ON public.historic
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = historic.shop_id
    )
  );

CREATE POLICY "historic_insert" ON public.historic
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = historic.shop_id
    )
  );

-- INVITATIONS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update" ON public.invitations;

CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.shops WHERE id = invitations.shop_id
    )
    OR token::text = current_setting('request.jwt.claims', true)::json->>'invitation_token'
  );

CREATE POLICY "invitations_insert" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.shops WHERE id = invitations.shop_id
    )
  );

CREATE POLICY "invitations_update" ON public.invitations
  FOR UPDATE TO authenticated
  USING (true);

-- CHOCOLATE_TYPE (legacy, même règles que products)
ALTER TABLE public.chocolate_type ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "choco_select" ON public.chocolate_type;
DROP POLICY IF EXISTS "choco_insert" ON public.chocolate_type;
DROP POLICY IF EXISTS "choco_update" ON public.chocolate_type;
DROP POLICY IF EXISTS "choco_delete" ON public.chocolate_type;

CREATE POLICY "choco_select" ON public.chocolate_type
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = chocolate_type.shop_id
    )
  );

CREATE POLICY "choco_insert" ON public.chocolate_type
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = chocolate_type.shop_id
    )
  );

CREATE POLICY "choco_update" ON public.chocolate_type
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = chocolate_type.shop_id
    )
  );

CREATE POLICY "choco_delete" ON public.chocolate_type
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.shop_member WHERE shop_id = chocolate_type.shop_id
    )
  );
