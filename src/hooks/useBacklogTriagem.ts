import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BacklogTriagemMotivo =
  | "cliente_em_atendimento"
  | "contato_em_andamento"
  | "processo_ativo"
  | "duvida_classificacao";

export interface BacklogTriagemRow {
  id: string;
  motivo: BacklogTriagemMotivo;
  telefone: string;
  telefone_digits: string;
  nome_capturado: string | null;
  msg_recebida: string;
  lead_existente_id: string | null;
  contact_submission_id: string | null;
  processo_id: string | null;
  resolvido: boolean;
  resolvido_em: string | null;
  resolvido_por: string | null;
  created_at: string;
}

export function useBacklogTriagem(resolvido = false) {
  const qc = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevIdsRef = useRef<Set<string> | null>(null);

  const query = useQuery({
    queryKey: ["backlog_triagem", resolvido],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backlog_triagem")
        .select("*")
        .eq("resolvido", resolvido)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as BacklogTriagemRow[];
    },
  });

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.preload = "auto";
  }, []);

  // Realtime + som ao entrar item novo
  useEffect(() => {
    const ch = supabase
      .channel("backlog_triagem_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "backlog_triagem" },
        () => {
          qc.invalidateQueries({ queryKey: ["backlog_triagem"] });
          qc.invalidateQueries({ queryKey: ["backlog_triagem_count"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  // Toca som ao receber item novo pendente
  useEffect(() => {
    if (resolvido) return;
    const data = query.data;
    if (!data) return;
    const ids = new Set(data.map((r) => r.id));
    if (prevIdsRef.current === null) {
      prevIdsRef.current = ids;
      return;
    }
    const novos = data.filter((r) => !prevIdsRef.current!.has(r.id));
    prevIdsRef.current = ids;
    if (novos.length && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [query.data, resolvido]);

  return query;
}

export function useBacklogTriagemCount() {
  return useQuery({
    queryKey: ["backlog_triagem_count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("backlog_triagem")
        .select("id", { count: "exact", head: true })
        .eq("resolvido", false);
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}
