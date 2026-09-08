import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Loader2, Square, UserRound } from "lucide-react";
import { useAssistantChat } from "@/hooks/useAssistant";
import { cn } from "@/lib/utils";

interface AssistantChatProps {
  threadId: string | null;
  persist: boolean;
  escalated?: boolean;
  onTitle?: (title: string) => void;
  onEscalated?: () => void;
  className?: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Que fait la Plateforme Freelance ?",
  "Combien coûte un sprint ?",
  "Comment saisir mon CRA ?",
];

const AssistantChat = ({
  threadId,
  persist,
  escalated = false,
  onTitle,
  onEscalated,
  className,
  suggestions = DEFAULT_SUGGESTIONS,
}: AssistantChatProps) => {
  const { messages, loading, streaming, error, sendMessage, stop, escalate } = useAssistantChat(
    threadId,
    persist,
    escalated,
  );
  const [input, setInput] = useState("");
  const [escalating, setEscalating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, streaming]);

  const submit = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || streaming) return;
    setInput("");
    await sendMessage(value, onTitle);
  };

  const handleEscalate = async () => {
    setEscalating(true);
    const ok = await escalate();
    setEscalating(false);
    if (ok) onEscalated?.();
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-white", className)}>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {loading && (
          <p className="text-center text-sm text-neutral-500">Chargement de la conversation…</p>
        )}

        {!loading && messages.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-neutral-700">
              Bonjour 👋 Je suis l'assistant Kistone. Posez-moi une question sur nos produits, nos
              tarifs, ou sur l'utilisation du portail.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border-2 border-black px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#E54D2A] hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#E54D2A] px-4 py-2.5 text-sm text-white">
                {m.content}
              </div>
            </div>
          ) : m.role === "human" ? (
            <div key={m.id} className="max-w-[95%] space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#E59500]">
                <UserRound className="h-3.5 w-3.5" /> Équipe Kistone
              </p>
              <div className="rounded-2xl rounded-bl-md border-2 border-black bg-[#FFF7ED] px-4 py-2.5 text-sm leading-relaxed text-neutral-900">
                <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-a:text-[#E54D2A]">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="max-w-[95%] text-sm leading-relaxed text-neutral-900">
              {m.content ? (
                <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-a:text-[#E54D2A]">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 text-neutral-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> L'assistant réfléchit…
                </span>
              )}
            </div>
          ),
        )}

        {error && (
          <p className="rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      {persist && !escalated && (
        <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-2">
          <button
            type="button"
            onClick={handleEscalate}
            disabled={escalating}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 underline-offset-2 hover:text-[#E54D2A] hover:underline disabled:opacity-50"
          >
            <UserRound className="h-3.5 w-3.5" />
            {escalating ? "Transmission…" : "Parler à un humain"}
          </button>
        </div>
      )}

      {escalated && (
        <p className="border-t border-neutral-200 bg-[#FFF7ED] px-4 py-2 text-[11px] text-neutral-700">
          Conversation transmise à l'équipe Kistone — vos messages arrivent directement chez nous,
          l'IA ne répond plus dans ce fil.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-neutral-200 bg-white p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border-2 border-black bg-white p-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={escalated ? "Écrivez à l'équipe Kistone…" : "Écrivez votre message…"}
            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-neutral-400"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Arrêter la génération"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Envoyer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E54D2A] text-white disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AssistantChat;
