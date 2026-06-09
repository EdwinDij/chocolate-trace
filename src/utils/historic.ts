import { supabase } from "./supabase";
import { Batch, BatchStatus } from "../types/batch";

export async function archiveBatch(
  batch: Batch,
  status: BatchStatus.PERIME | BatchStatus.NON_CONFORME | BatchStatus.EPUISE,
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
  // console.log("Archiving batch", batch.reference, "with status", status, "and reason", reason);
  // console.log("historic insert error:", error);

  return error;
}