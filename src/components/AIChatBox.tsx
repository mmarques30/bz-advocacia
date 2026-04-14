import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Trash2, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatHistory, type ConversationSummary } from "@/components/chat/ChatHistory";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const PREDEFINED_QUESTIONS = [
  "Quantos leads novos entraram este mês?",
  "Quais tarefas estão atrasadas?",
  "Resumo financeiro do mês atual",
  "Quais prazos vencem nos próximos 7 dias?",
  "Como está a taxa de conversão de leads?",
  "Quais clientes têm pagamentos pendentes?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

function getStoredConversationId(userId: string): string {
  const key = `bz_chat_conversation_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const newId = crypto.randomUUID();
  localStorage.setItem(key, newId);
  return newId;
}

function setStoredConversationId(userId: string, id: string) {
  localStorage.setItem(`bz_chat_conversation_${userId}`, id);
}

export function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { session } = useAuth();

  // Initialize conversationId from localStorage
  useEffect(() => {
    if (session?.user?.id && !conversationId) {
      setConversationId(getStoredConversationId(session.user.id));
    }
  }, [session?.user?.id, conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && !showHistory) {
      inputRef.current.focus();
    }
  }, [isOpen, showHistory]);

  // Load messages for current conversation
  useEffect(() => {
    if (!isOpen || !session || !conversationId) return;
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages" as any)
        .select("id, role, content")
        .eq("conversation_id", conversationId)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
      }
    };
    load();
  }, [isOpen, session, conversationId]);

  // Load conversation history list
  const loadHistory = useCallback(async () => {
    if (!session) return;
    setHistoryLoading(true);
    try {
      const { data } = await supabase
        .from("chat_messages" as any)
        .select("conversation_id, content, role, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const grouped = new Map<string, { first_message: string; first_at: string; last_at: string }>();
        (data as any[]).forEach((m) => {
          const existing = grouped.get(m.conversation_id);
          if (!existing) {
            grouped.set(m.conversation_id, {
              first_message: m.role === "user" ? m.content.slice(0, 80) : "",
              first_at: m.created_at,
              last_at: m.created_at,
            });
          } else {
            existing.last_at = m.created_at;
            if (!existing.first_message && m.role === "user") {
              existing.first_message = m.content.slice(0, 80);
            }
          }
        });

        const list: ConversationSummary[] = Array.from(grouped.entries())
          .map(([id, info]) => ({
            conversation_id: id,
            first_message: info.first_message,
            first_at: info.first_at,
            last_at: info.last_at,
          }))
          .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

        setConversations(list);
      } else {
        setConversations([]);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [session]);

  const handleToggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory(!showHistory);
  };

  const handleSelectConversation = (id: string) => {
    if (session?.user?.id) {
      setConversationId(id);
      setStoredConversationId(session.user.id, id);
    }
    setShowHistory(false);
    setMessages([]);
  };

  const handleNewConversation = () => {
    if (!session?.user?.id) return;
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setStoredConversationId(session.user.id, newId);
    setMessages([]);
    setShowHistory(false);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !session) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      let assistantSoFar = "";
      const assistantId = crypto.randomUUID();

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ message: text.trim(), conversationId }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
          throw new Error(err.error || `Erro ${resp.status}`);
        }

        if (!resp.body) throw new Error("No stream");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantSoFar += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.id === assistantId) {
                    return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantSoFar } : m));
                  }
                  return [...prev, { id: assistantId, role: "assistant", content: assistantSoFar }];
                });
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        if (buffer.trim()) {
          for (let raw of buffer.split("\n")) {
            if (!raw || !raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantSoFar += content;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: assistantSoFar } : m))
                );
              }
            } catch {}
          }
        }
      } catch (e: any) {
        toast.error(e.message || "Erro ao enviar mensagem");
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, session, conversationId]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    if (session) {
      await supabase
        .from("chat_messages" as any)
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", session.user.id);
    }
  };

  return (
    <>
      {/* Floating button with BZ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Abrir assistente BZ"
      >
        <span className="font-bold text-lg tracking-tight">BZ</span>
      </button>

      {/* Chat box */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[380px] flex-col rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300",
          isOpen ? "h-[540px] scale-100 opacity-100" : "h-0 scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-primary-foreground">B&Z</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80"
              onClick={handleNewConversation}
              title="Nova conversa"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80",
                showHistory && "bg-primary/60 text-primary-foreground"
              )}
              onClick={handleToggleHistory}
              title="Histórico"
            >
              <History className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80"
              onClick={clearChat}
              title="Limpar conversa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80"
              onClick={() => { setIsOpen(false); setShowHistory(false); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content area */}
        {showHistory ? (
          <ChatHistory
            conversations={conversations}
            loading={historyLoading}
            activeConversationId={conversationId}
            onSelect={handleSelectConversation}
          />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            predefinedQuestions={PREDEFINED_QUESTIONS}
            onSendMessage={sendMessage}
            scrollRef={scrollRef}
          />
        )}

        {/* Input */}
        {!showHistory && (
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
