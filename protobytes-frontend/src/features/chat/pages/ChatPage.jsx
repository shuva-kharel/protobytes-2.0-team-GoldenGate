import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { chatApi } from "../../../api/chatApi";
import { useAuth } from "../../auth/authStore";

function getSocketBaseUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return apiBase.replace(/\/api\/?$/, "");
}

function getAvatarUrl(user) {
  const pic = user?.profilePicture;
  if (!pic) return "";
  return typeof pic === "string" ? pic : pic?.url || "";
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getConversationPreview(conversation) {
  if (!conversation?.lastMessage) return "No messages yet";
  if (conversation.lastMessage.type === "product") return "Shared a product";
  return conversation.lastMessage.text || "No messages yet";
}

function ProductBubble({ product }) {
  if (!product) return null;

  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 space-y-2 max-w-sm">
      <div className="text-xs uppercase tracking-wide text-rose-700 font-semibold">
        Product Context
      </div>
      <div className="flex gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-16 w-16 rounded-lg object-cover border"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-white border flex items-center justify-center text-xs text-gray-500">
            No Image
          </div>
        )}
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-semibold truncate">{product.name}</p>
          <p className="text-xs text-gray-600">{product.category || "General"}</p>
          <p className="text-xs text-gray-600">Location: {product.location || "—"}</p>
          <p className="text-xs text-rose-700 font-semibold">Borrow: Rs {product.borrowPrice ?? 0}</p>
          {product.productId && (
            <Link
              to={`/?productId=${product.productId}`}
              className="text-xs text-rose-700 underline"
            >
              View product
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRealtimeReady, setIsRealtimeReady] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef("");

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const loadConversations = useCallback(async () => {
    const res = await chatApi.listConversations();
    setConversations(res.data?.items || []);
    return res.data?.items || [];
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => String(c._id) === String(activeConversationId)) || null,
    [conversations, activeConversationId]
  );

  const openOrCreateConversation = useCallback(
    async (targetUserId) => {
      if (!targetUserId) return;
      const productId = searchParams.get("productId") || undefined;

      const res = await chatApi.getOrCreateConversation(targetUserId, { productId });
      const convo = res.data?.conversation;
      if (!convo?._id) return;

      setActiveConversationId(String(convo._id));
      await loadConversations();

      if (productId) {
        const next = new URLSearchParams(searchParams);
        next.delete("productId");
        setSearchParams(next, { replace: true });
      }
    },
    [loadConversations, searchParams, setSearchParams]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const list = await loadConversations();

        if (userId) {
          await openOrCreateConversation(userId);
          return;
        }

        if (mounted && list.length > 0) {
          const first = list[0];
          const otherId = first?.otherUser?._id;
          if (otherId) {
            navigate(`/chat/${otherId}`, { replace: true });
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load chat");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadConversations, navigate, openOrCreateConversation, userId]);

  useEffect(() => {
    if (!activeConversationId) return;
    let mounted = true;

    (async () => {
      try {
        const res = await chatApi.getMessages(activeConversationId, { limit: 60 });
        if (mounted) setMessages(res.data?.items || []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || "Failed to load messages");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    setIsRealtimeReady(false);

    (async () => {
      try {
        const moduleName = "socket.io-client";
        const socketIoClient = await import(/* @vite-ignore */ moduleName);
        if (cancelled) return;
        const socket = socketIoClient.io(getSocketBaseUrl(), {
          withCredentials: true,
          transports: ["websocket", "polling"],
        });

        socketRef.current = socket;
        socket.on("connect", () => setIsRealtimeReady(true));
        socket.on("disconnect", () => setIsRealtimeReady(false));
        socket.on("connect_error", () => setIsRealtimeReady(false));

        socket.on("chat:message:new", (msg) => {
          if (!msg?.conversation) return;

          const conversationId = String(msg.conversation);
          if (conversationId === String(activeConversationIdRef.current)) {
            setMessages((prev) => {
              if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
              return [...prev, msg];
            });
          }
        });

        socket.on("chat:conversation:updated", () => {
          loadConversations().catch(() => {});
        });
      } catch {
        // socket.io-client not installed yet; chat still works via REST fallback.
        setIsRealtimeReady(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsRealtimeReady(false);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [loadConversations, user?._id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) return;

    socket.emit("chat:join", { conversationId: activeConversationId });

    return () => {
      socket.emit("chat:leave", { conversationId: activeConversationId });
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (isRealtimeReady) return;
    if (!activeConversationId) return;

    const interval = setInterval(async () => {
      try {
        const [messageRes] = await Promise.all([
          chatApi.getMessages(activeConversationId, { limit: 60 }),
          loadConversations(),
        ]);
        setMessages(messageRes.data?.items || []);
      } catch {
        // keep silent; user already sees persistent errors from explicit actions
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeConversationId, isRealtimeReady, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSelectConversation = (conversation) => {
    const otherId = conversation?.otherUser?._id;
    if (!otherId) return;
    navigate(`/chat/${otherId}`);
  };

  const onSend = async () => {
    const value = text.trim();
    if (!value || !activeConversationId) return;

    const socket = socketRef.current;
    setText("");

    if (socket?.connected) {
      socket.emit(
        "chat:message:send",
        { conversationId: activeConversationId, text: value },
        async (ack) => {
          if (!ack?.ok) {
            setError(ack?.error || "Message send failed");
            setText(value);
          }
        }
      );
      return;
    }

    try {
      const res = await chatApi.sendMessage(activeConversationId, value);
      const created = res.data?.message;
      if (created) setMessages((prev) => [...prev, created]);
      loadConversations().catch(() => {});
    } catch (err) {
      setError(err?.response?.data?.message || "Message send failed");
      setText(value);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-10">Loading chat…</div>;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="h-[72vh] rounded-2xl border border-rose-100 bg-white grid md:grid-cols-[300px_1fr] overflow-hidden">
        <aside className="border-r border-rose-100 bg-rose-50/30">
          <div className="px-4 py-3 border-b border-rose-100">
            <h1 className="text-lg font-semibold">Chats</h1>
            <p className="text-xs text-gray-600">Only users you have chatted with</p>
          </div>

          <div className="overflow-y-auto h-[calc(72vh-57px)]">
            {conversations.length === 0 && (
              <div className="p-4 text-sm text-gray-600">No conversations yet.</div>
            )}

            {conversations.map((conversation) => {
              const other = conversation.otherUser;
              const active = String(conversation._id) === String(activeConversationId);
              const avatar = getAvatarUrl(other);

              return (
                <button
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full text-left p-3 border-b border-rose-100/70 hover:bg-rose-50 ${
                    active ? "bg-rose-100/70" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={other?.username || "User"}
                        className="h-10 w-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full border bg-white flex items-center justify-center text-xs text-gray-500">
                        {(other?.username || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{other?.fullName || other?.username}</p>
                      <p className="text-xs text-gray-600 truncate">{getConversationPreview(conversation)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex flex-col min-h-0">
          <header className="px-4 py-3 border-b border-rose-100 flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {activeConversation?.otherUser?._id ? (
                  <Link
                    to={`/user/${activeConversation.otherUser._id}`}
                    className="hover:text-rose-700"
                  >
                    {activeConversation?.otherUser?.fullName ||
                      activeConversation?.otherUser?.username}
                  </Link>
                ) : (
                  "Select a chat"
                )}
              </p>
              <p className="text-xs text-gray-600">
                {isRealtimeReady ? "Realtime chat enabled" : "Syncing every few seconds"}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-rose-50/35">
            {messages.length === 0 && (
              <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
            )}

            {messages.map((msg) => {
              const mine = String(msg?.sender?._id || msg?.sender) === String(user?._id);
              return (
                <div
                  key={msg._id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    {msg.type === "product" ? (
                      <ProductBubble product={msg.product} />
                    ) : (
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                          mine
                            ? "bg-rose-600 text-white rounded-br-sm"
                            : "bg-white border border-rose-100 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                    <span className="text-[11px] text-gray-500">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <footer className="border-t border-rose-100 p-3">
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSend();
                }}
                disabled={!activeConversationId}
                className="flex-1 border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button
                onClick={onSend}
                disabled={!activeConversationId || !text.trim()}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
