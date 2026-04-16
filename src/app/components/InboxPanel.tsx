import { useState, useEffect } from "react";
import { Mail, Loader2, Reply, Send, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import {
  getInbox, markInterestRead, expressInterest, InboxItem,
} from "../lib/api";

interface Props {
  token: string;
  userEmail: string;
  emptyMessage?: string;
}

// Groups messages by (target_id + target_owner_id + from_user_id) so replies
// are visually threaded under the original message.
function threadKey(item: InboxItem): string {
  // Use sorted pair of participants + target so replies cluster together
  const participants = [item.from_user_id, item.target_owner_id].sort().join("|");
  return `${participants}::${item.target_id}`;
}

export default function InboxPanel({ token, userEmail, emptyMessage }: Props) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    getInbox(token)
      .then(setItems)
      .catch(() => setError("Failed to load inbox"))
      .finally(() => setLoading(false));
  }, [token, refreshKey]);

  const handleMarkRead = async (id: string) => {
    await markInterestRead(token, id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: 1 } : item))
    );
  };

  const handleReply = async (original: InboxItem) => {
    if (!replyText.trim()) return;
    setSending(true);
    setSendError("");
    try {
      // If I sent the original, reply goes to the target owner; otherwise to the sender
      const amISender = original.from_email === userEmail;
      const replyToOwnerId = amISender ? original.target_owner_id : original.from_user_id;

      await expressInterest(token, {
        from_org_name: "",
        target_type: original.target_type as "item" | "buyer_profile",
        target_id: original.target_id,
        target_title: original.target_title,
        target_owner_id: replyToOwnerId,
        message: replyText.trim(),
      });

      // Optimistically add the reply to the list
      const newItem: InboxItem = {
        id: `temp-${Date.now()}`,
        from_user_id: "",
        from_email: userEmail,
        from_org_name: "",
        from_role: "",
        target_type: original.target_type,
        target_id: original.target_id,
        target_title: original.target_title,
        target_owner_id: replyToOwnerId,
        message: replyText.trim(),
        is_read: 1,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const toggleThread = (key: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return <div className="py-12 text-center text-sm text-red-500">{error}</div>;
  }

  // Group into threads
  const threadMap = new Map<string, InboxItem[]>();
  for (const item of items) {
    const key = threadKey(item);
    if (!threadMap.has(key)) threadMap.set(key, []);
    threadMap.get(key)!.push(item);
  }

  // Sort threads by most recent message
  const threads = Array.from(threadMap.entries()).sort((a, b) => {
    const latestA = a[1][0].created_at;
    const latestB = b[1][0].created_at;
    return latestB.localeCompare(latestA);
  });

  return (
    <div className="py-8 px-8">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Inbox</h2>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {emptyMessage ?? "No messages yet."}
          </div>
        ) : (
          threads.map(([key, msgs]) => {
            const latest = msgs[0];
            const rest = msgs.slice(1);
            const hasUnread = msgs.some((m) => !m.is_read && m.from_email !== userEmail);
            const isCollapsed = collapsedThreads.has(key);
            const amISender = latest.from_email === userEmail;

            return (
              <div
                key={key}
                className={`bg-white rounded-2xl border shadow-sm transition-all ${
                  hasUnread ? "border-emerald-300" : "border-gray-100"
                }`}
              >
                {/* Latest / first message */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {amISender
                            ? `You → ${latest.target_owner_id ? latest.from_email : "?"}`
                            : (latest.from_org_name || latest.from_email)}
                        </span>
                        {hasUnread && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                            New
                          </span>
                        )}
                        {!amISender && (
                          <span className="text-xs text-gray-400 capitalize">{latest.from_role}</span>
                        )}
                        {amISender && (
                          <span className="text-xs text-gray-400">Sent</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        Re: <span className="font-medium text-gray-700">{latest.target_title}</span>
                      </p>
                      {latest.message && (
                        <p className="text-sm text-gray-700 leading-relaxed">{latest.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(latest.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {hasUnread && !amISender && (
                        <button
                          onClick={() => handleMarkRead(latest.id)}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Older messages in thread */}
                  {rest.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleThread(key)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        {isCollapsed
                          ? `Show ${rest.length} earlier message${rest.length > 1 ? "s" : ""}`
                          : "Hide earlier messages"}
                      </button>

                      {!isCollapsed && (
                        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                          {rest.map((msg) => {
                            const isMine = msg.from_email === userEmail;
                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}
                              >
                                <div
                                  className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    isMine
                                      ? "bg-emerald-600 text-white rounded-tr-sm"
                                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                                  }`}
                                >
                                  {msg.message}
                                  <p className={`text-xs mt-1 ${isMine ? "text-emerald-200" : "text-gray-400"}`}>
                                    {new Date(msg.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reply section */}
                <div className="border-t border-gray-100 px-5 py-3">
                  {replyingTo === latest.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply…"
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all resize-none"
                      />
                      {sendError && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{sendError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); setSendError(""); }}
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(latest)}
                          disabled={!replyText.trim() || sending}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                          {sending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReplyingTo(latest.id); setSendError(""); }}
                      className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
