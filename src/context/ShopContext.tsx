import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import type { User } from "@supabase/supabase-js";
import type { Plan } from "../hooks/usePlanGate";

interface Shop {
  id: string;
  name: string;
  work: string;
  owner_id: string;
  onboarded: boolean;
}

interface ShopMember {
  role: "gerant" | "responsable" | "employe";
  shop_id: string;
}

interface ShopContextType {
  user: User | null;
  shop: Shop | null;
  member: ShopMember | null;
  shops: Shop[];
  plan: Plan;
  loading: boolean;
  refreshShop: () => Promise<void>;
  switchShop: (shopId: string) => void;
  signOut: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [member, setMember] = useState<ShopMember | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [plan, setPlan] = useState<Plan>("gratuit");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadShops(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadShops(session.user.id);
      } else {
        setUser(null);
        setShop(null);
        setMember(null);
        setShops([]);
        setPlan("gratuit");
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadShops = async (userId: string) => {
    try {
      // 1. Charge le plan depuis subscriptions
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", userId)
        .single();

      if (subData?.plan) setPlan(subData.plan as Plan);

      // 2. Charge les boutiques owned
      const { data: ownedShops } = await supabase
        .from("shops")
        .select("id, name, work, owner_id, onboarded")
        .eq("owner_id", userId);

      // 3. Charge les boutiques membre
      const { data: memberData } = await supabase
        .from("shop_member")
        .select("shop_id, role")
        .eq("user_id", userId);

      const memberShopIds = memberData?.map((m) => m.shop_id) || [];

      let memberShops: Shop[] = [];
      if (memberShopIds.length > 0) {
        const { data } = await supabase
          .from("shops")
          .select("id, name, work, owner_id, onboarded")
          .in("id", memberShopIds);
        memberShops = data || [];
      }

      const ownedIds = new Set((ownedShops || []).map((s) => s.id));
      const allShops: Shop[] = [
        ...(ownedShops || []),
        ...memberShops.filter((s) => !ownedIds.has(s.id)),
      ];

      setShops(allShops);

      if (allShops.length > 0) {
        await selectShop(userId, allShops[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectShop = async (userId: string, selectedShop: Shop) => {
    setShop(selectedShop);

    if (selectedShop.owner_id === userId) {
      setMember({ role: "gerant", shop_id: selectedShop.id });
    } else {
      const { data } = await supabase
        .from("shop_member")
        .select("role, shop_id")
        .eq("user_id", userId)
        .eq("shop_id", selectedShop.id)
        .single();

      if (data) setMember(data as ShopMember);
    }
  };

  const switchShop = (shopId: string) => {
    const selected = shops.find((s) => s.id === shopId);
    if (selected && user) selectShop(user.id, selected);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  const refreshShop = async () => {
    if (!shop || !user) return;
    const { data } = await supabase
      .from("shops")
      .select("id, name, work, owner_id, onboarded")
      .eq("id", shop.id)
      .single();
    if (data) setShop(data);
  };
  return (
    <ShopContext.Provider
      value={{
        user,
        shop,
        member,
        shops,
        plan,
        loading,
        switchShop,
        signOut,
        refreshShop,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop doit être utilisé dans un ShopProvider");
  return ctx;
}
