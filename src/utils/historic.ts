import { supabase } from "./supabase";

interface Batch {
  id: string;
  reference: string;
  week_receiving: string;
  chocolate_type: { name: string };
}

export async function archiveBatch(
  batch: Batch,
  status: "perime" | "non_conforme" | "epuise",
  reason?: string
) {
  const { error } = await supabase.from("historic").insert({
    batch_id: batch.id,
    type_name: batch.chocolate_type.name,
    reference: batch.reference,
    status,
    reason: reason || null,
    week_receiving: batch.week_receiving,
  });
  console.log("Archiving batch", batch.reference, "with status", status, "and reason", reason);
  console.log("historic insert error:", error);

  return error;
}