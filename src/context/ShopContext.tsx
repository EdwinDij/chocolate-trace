import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import type { User } from "@supabase/supabase-js";

interface Shop {
  id: string;
  name: string;
  work: string;
  plan: string;
  owner_id: string;
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
  loading: boolean;
  switchShop: (shopId: string) => void;
  signOut: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [member, setMember] = useState<ShopMember | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
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
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadShops = async (userId: string) => {
    // Récupère toutes les boutiques du gérant (owner)
    const { data: ownedShops } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", userId);

    // Récupère les boutiques où il est membre (responsable/employé)
    const { data: memberShops } = await supabase
      .from("shop_member")
      .select("shop_id, role, shops(*)")
      .eq("user_id", userId);

    const allShops: Shop[] = [
      ...(ownedShops || []),
      ...(memberShops?.map((m) => m.shops as unknown as Shop) || []),
    ];

    setShops(allShops);

    // Sélectionne la première boutique par défaut
    if (allShops.length > 0) {
      await selectShop(userId, allShops[0]);
    }

    setLoading(false);
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

  return (
    <ShopContext.Provider
      value={{ user, shop, member, shops, loading, switchShop, signOut }}
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
