import { supabase } from "./supabase";
import { Batch, BatchStatus } from "../types/batch";

export async function archiveBatch(
  batch: Batch,
  status: BatchStatus.PERIME | BatchStatus.NON_CONFORME | BatchStatus.EPUISE,
  reason?: string
) {
  const { error } = await supabase.from("historic").insert({
    batch_id: batch.id,
    shop_id: batch.shop_id,
    type_name: batch.products.name,
    reference: batch.reference,
    status,
    reason: reason || null,
    week_receiving: batch.week_receiving,
  });

  return error;
}