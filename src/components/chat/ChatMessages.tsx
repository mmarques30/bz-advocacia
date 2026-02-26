import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  predefinedQuestions: string[];
  onSendMessage: (text: string) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

function formatMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)/gm, "• $1")
    .replace(/^(\d+)\. (.+)/gm, "$1. $2")
    .replace(/\n/g, "<br />");
}

export function ChatMessages({ messages, isLoading, predefinedQuestions, onSendMessage, scrollRef }: ChatMessagesProps) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && !isLoading && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center">Olá! Como posso ajudar?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {predefinedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => onSendMessage(q)}
                className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}
            dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
          />
        </div>
      ))}

      {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
