import { supabase } from "@/api/supabase/client";
import { handleSupabaseError } from "./supabase-error-handler";

export const recordProfileView = async (profileId: string, viewerId: string | null) => {
  try {
    const { error } = await supabase.rpc('record_profile_view', {
      p_profile_id: profileId,
      p_viewer_id: viewerId,
    });

    if (error) {
      handleSupabaseError(error, "Erro ao registrar visualização do perfil.");
      return false;
    }
    return true;
  } catch (error: Error) {
    handleSupabaseError(error, "Erro inesperado ao registrar visualização do perfil.");
    return false;
  }
};

export const getProfileViewsCount = async (profileId: string, startDate: Date, endDate: Date) => {
  try {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const p_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const { data, error } = await supabase.rpc('get_daily_profile_views', {
      p_profile_id: profileId,
      p_days: p_days,
    });

    if (error) {
      handleSupabaseError(error, "Erro ao buscar contagem de visualizações.");
      return 0;
    }
    // The RPC returns a table, so we need to sum the counts
    return data.reduce((sum: number, row: { count: number }) => sum + row.count, 0);
  } catch (error: Error) {
    handleSupabaseError(error, "Erro inesperado ao buscar contagem de visualizações.");
    return 0;
  }
};
