import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, User, X, Loader2, MessageCircle } from "lucide-react";

import { askZai, getZaiSummary } from "../../service/api";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const PALETTE = {
  emerald: '#00ff94',
  rose: '#ff3356',
  gold: '#ffcc00',
  indigo: '#8b7fff',
  sky: '#00d4ff',
};

const extractResponse = (data) => {
  if (!data) return "";
  if (typeof data === "string") {
    try {
      return extractResponse(JSON.parse(data));
    } catch {
      return data;
    }
  }
  if (typeof data === "object") {
    return data.response || data.answer || data.message || data.text || JSON.stringify(data);
  }
  return String(data);
};

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

const FormattedText = ({ content }) => {
  return (
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                  <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '20px 0 12px', letterSpacing: '-0.02em' }}>
                    {children}
                  </h1>
              ),
              h2: ({ children }) => (
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '18px 0 10px', letterSpacing: '-0.01em' }}>
                    {children}
                  </h2>
              ),
              h3: ({ children }) => (
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '16px 0 10px', paddingLeft: 12, borderLeft: `3px solid ${PALETTE.emerald}` }}>
                    {children}
                  </h3>
              ),
              strong: ({ children }) => (
                  <span style={{ fontWeight: 700, color: PALETTE.emerald }}>
              {children}
            </span>
              ),
              ul: ({ children }) => (
                  <ul style={{ listStyle: 'none', margin: '12px 0', padding: 0 }}>
                    {children}
                  </ul>
              ),
              li: ({ children }) => (
                  <li style={{ display: 'flex', gap: 10, margin: '8px 0', alignItems: 'flex-start' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: PALETTE.emerald, flexShrink: 0, marginTop: 5 }} />
                    <span>{children}</span>
                  </li>
              ),
              p: ({ children }) => (
                  <p style={{ margin: '10px 0', color: 'rgba(255,255,255,0.8)' }}>
                    {children}
                  </p>
              ),
              code: ({ inline, children }) =>
                  inline ? (
                      <code style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: PALETTE.indigo,
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: '"DM Mono", monospace'
                      }}>
                        {children}
                      </code>
                  ) : (
                      <code style={{
                        display: 'block',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: 12,
                        borderRadius: 10,
                        fontSize: 12,
                        fontFamily: '"DM Mono", monospace',
                        overflow: 'auto',
                        margin: '12px 0'
                      }}>
                        {children}
                      </code>
                  ),
            }}
        >
          {content}
        </ReactMarkdown>
      </div>
  );
};

const QuickAction = ({ text, onClick, disabled }) => (
    <button
        onClick={() => onClick(text)}
        disabled={disabled}
        style={{
          padding: '10px 16px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={e => {
          e.target.style.background = 'rgba(255,255,255,0.07)';
          e.target.style.color = '#fff';
          e.target.style.borderColor = `${PALETTE.emerald}40`;
        }}
        onMouseLeave={e => {
          e.target.style.background = 'rgba(255,255,255,0.03)';
          e.target.style.color = 'rgba(255,255,255,0.6)';
          e.target.style.borderColor = 'rgba(255,255,255,0.08)';
        }}
    >
      {text}
    </button>
);

const MessageBubble = ({ role, content, isLoading }) => {
  const isUser = role === 'user';

  return (
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 20
      }}>
        {!isUser && (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `${PALETTE.emerald}15`,
              border: `1px solid ${PALETTE.emerald}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: PALETTE.emerald
            }}>
              <Sparkles size={14} />
            </div>
        )}

        <div style={{
          maxWidth: '75%',
          borderRadius: 16,
          padding: '12px 16px',
          background: isUser ? '#fff' : 'rgba(255,255,255,0.04)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
          color: isUser ? '#000' : 'rgba(255,255,255,0.8)'
        }}>
          {isLoading ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PALETTE.emerald, animation: 'bounce 1.4s infinite' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PALETTE.emerald, animation: 'bounce 1.4s infinite 0.2s' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: PALETTE.emerald, animation: 'bounce 1.4s infinite 0.4s' }} />
              </div>
          ) : isUser ? (
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{content}</p>
          ) : (
              <FormattedText content={content} />
          )}
        </div>

        {isUser && (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#000'
            }}>
              <User size={14} />
            </div>
        )}
      </div>
  );
};

export default function ZaiAI({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (overrideText = null) => {
    const text = typeof overrideText === "string" ? overrideText.trim() : input.trim();

    if (!text || loading) return;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await askZai(text);
      const response = extractResponse(res);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Zai AI Error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I couldn't connect to Zai right now. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (summaryLoading || loading) return;

    setSummaryLoading(true);

    try {
      const res = await getZaiSummary();
      const summary = extractResponse(res);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `## Your Financial Snapshot\n\n${summary}` }
      ]);
    } catch (error) {
      console.error("Summary Error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I couldn't retrieve your financial summary right now." }
      ]);
    } finally {
      setSummaryLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleClose = () => {
    if (onClose && typeof onClose === "function") {
      onClose();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const QUICK_ACTIONS = [
    "Analyze my spending",
    "How can I improve my savings?",
    "Give me a financial overview",
  ];

  return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#000',
        color: '#fff',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        overflow: 'hidden'
      }}>
        <style>{css}</style>

        {/* Header */}
        <header style={{
          flexShrink: 0,
          height: 72,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(12px)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${PALETTE.emerald}15`,
              border: `1px solid ${PALETTE.emerald}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PALETTE.emerald,
              position: 'relative'
            }}>
              <Sparkles size={18} />
              <span style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                background: PALETTE.emerald,
                opacity: 0.06,
                filter: 'blur(20px)',
                pointerEvents: 'none'
              }} />
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: '-0.01em'
              }}>
                Zai
              </h1>
              <p style={{
                margin: '2px 0 0',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}>
                Financial Assistant
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {messages.length > 0 && (
                <button
                    onClick={clearChat}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = 'rgba(255,255,255,0.07)';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'rgba(255,255,255,0.03)';
                      e.target.style.color = 'rgba(255,255,255,0.5)';
                    }}
                >
                  New Chat
                </button>
            )}
            <button
                onClick={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'rgba(255,255,255,0.04)';
                  e.target.style.color = 'rgba(255,255,255,0.4)';
                }}
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth'
        }}>
          <div style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '32px 24px 64px',
            minHeight: '100%'
          }}>

            {/* Empty State */}
            {!messages.length && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: 'calc(100vh - 200px)',
                  gap: 24
                }}>
                  <div style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    marginBottom: 8
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: PALETTE.emerald,
                      opacity: 0.1,
                      filter: 'blur(30px)'
                    }} />
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: 20,
                      background: `${PALETTE.emerald}15`,
                      border: `1px solid ${PALETTE.emerald}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: PALETTE.emerald
                    }}>
                      <Sparkles size={36} />
                    </div>
                  </div>

                  <div>
                    <h2 style={{
                      fontSize: 28,
                      fontWeight: 900,
                      margin: '0 0 12px',
                      letterSpacing: '-0.02em'
                    }}>
                      Meet Zai
                    </h2>
                    <p style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.4)',
                      margin: 0,
                      maxWidth: 400,
                      lineHeight: 1.6
                    }}>
                      Your intelligent financial assistant. Ask about spending, savings, transactions, or financial goals.
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'center',
                    maxWidth: 600
                  }}>
                    {QUICK_ACTIONS.map(action => (
                        <QuickAction
                            key={action}
                            text={action}
                            onClick={sendMessage}
                            disabled={loading}
                        />
                    ))}
                  </div>

                  <button
                      onClick={loadSummary}
                      disabled={summaryLoading}
                      style={{
                        marginTop: 16,
                        padding: '12px 24px',
                        borderRadius: 12,
                        background: PALETTE.emerald,
                        border: 'none',
                        color: '#000',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        opacity: summaryLoading ? 0.6 : 1
                      }}
                      onMouseEnter={e => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = `0 8px 24px ${PALETTE.emerald}40`;
                      }}
                      onMouseLeave={e => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                  >
                    {summaryLoading ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Sparkles size={14} />
                    )}
                    Analyze My Finances
                  </button>
                </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
                <MessageBubble
                    key={idx}
                    role={msg.role}
                    content={msg.content}
                    isLoading={false}
                />
            ))}

            {/* Loading Indicator */}
            {loading && (
                <MessageBubble
                    role="assistant"
                    content=""
                    isLoading={true}
                />
            )}

            <div ref={bottomRef} />
          </div>
        </main>

        {/* Input Footer */}
        <footer style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: '#000',
          padding: '16px 24px 24px'
        }}>
          <div style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            gap: 12
          }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '8px 12px',
              transition: 'all 0.2s',
              focusWithin: {
                borderColor: `${PALETTE.emerald}40`,
                background: 'rgba(255,255,255,0.05)'
              }
            }}>
            <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask Zai anything..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'none',
                  maxHeight: 100,
                  minHeight: 40,
                  padding: '4px 0'
                }}
                rows={1}
            />
            </div>

            <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: input.trim() && !loading ? PALETTE.emerald : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: input.trim() && !loading ? '#000' : 'rgba(255,255,255,0.2)',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  if (input.trim() && !loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = `0 8px 16px ${PALETTE.emerald}40`;
                  }
                }}
                onMouseLeave={e => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
            >
              <Send size={16} />
            </button>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: 12
          }}>
            <p style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.15)',
              margin: 0,
              letterSpacing: '0.05em'
            }}>
              Zai can make mistakes. Verify important financial information.
            </p>
          </div>
        </footer>
      </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
* { box-sizing: border-box; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bounce { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-6px); } }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;