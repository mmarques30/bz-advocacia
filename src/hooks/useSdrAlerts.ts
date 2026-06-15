import { useEffect, useRef, useState, useCallback } from "react";
import type { Lead } from "@/types/leads";

const SOUND_KEY = "sdr_sound_enabled";
const NOTIF_KEY = "sdr_notifications_enabled";

// TODO (futuro): Push real com Service Worker + VAPID keys para notificar
// mesmo com o navegador fechado. Esta implementação atual usa a Notifications
// API simples — só funciona enquanto a aba/navegador estiver aberto.

export function useSdrAlerts(leads: Lead[] | undefined, onOpenLead?: (lead: Lead) => void) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === "true";
  });
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    return Notification.permission;
  });
  const [notifEnabled, setNotifEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(NOTIF_KEY) === "true";
  });

  const setSoundEnabled = useCallback((v: boolean) => {
    setSoundEnabledState(v);
    localStorage.setItem(SOUND_KEY, String(v));
  }, []);

  const requestNotifications = useCallback(async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    const enabled = perm === "granted";
    setNotifEnabledState(enabled);
    localStorage.setItem(NOTIF_KEY, String(enabled));
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousIdsRef = useRef<Set<string> | null>(null);
  const onOpenLeadRef = useRef(onOpenLead);
  onOpenLeadRef.current = onOpenLead;

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!leads) return;
    // Mesmo criterio do badge/botao/contador: ignora leads que ja avançaram
    // pra estagio pos-bot mesmo que o status_sdr antigo ainda esteja como
    // sql_aguardando_humano (descompasso conhecido — leadStatusAutomation
    // so atualiza estagio).
    const isHot = (l: Lead) =>
      l.status_sdr === "sql_aguardando_humano" &&
      l.estagio !== "fechado" &&
      l.estagio !== "proposta_enviada" &&
      l.estagio !== "perdido";
    const hotIds = new Set(
      leads.filter(isHot).map((l) => l.id),
    );

    // Mount inicial: apenas armazena, não dispara
    if (previousIdsRef.current === null) {
      previousIdsRef.current = hotIds;
      return;
    }

    const novos = leads.filter(
      (l) => isHot(l) && !previousIdsRef.current!.has(l.id),
    );
    previousIdsRef.current = hotIds;

    if (novos.length === 0) return;

    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    if (notifEnabled && "Notification" in window && Notification.permission === "granted") {
      for (const lead of novos) {
        const tipo = lead.tipo_processo === "Outro" && lead.outro_tipo_processo
          ? lead.outro_tipo_processo
          : lead.tipo_processo;
        const n = new Notification("Novo lead quente!", {
          body: `${lead.nome_completo}${tipo ? " - " + tipo : ""}`,
          icon: "/favicon.ico",
          tag: lead.id,
          requireInteraction: true,
        });
        n.onclick = () => {
          window.focus();
          onOpenLeadRef.current?.(lead);
          n.close();
        };
      }
    }
  }, [leads, soundEnabled, notifEnabled]);

  return {
    soundEnabled,
    setSoundEnabled,
    notifPermission,
    notifEnabled,
    requestNotifications,
  };
}
