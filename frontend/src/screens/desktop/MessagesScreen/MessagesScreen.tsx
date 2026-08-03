"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, ChevronRight } from "lucide-react";
import styles from "./MessagesScreen.module.css";

type Conversation = {
  otherId: string;
  otherName: string;
  otherRole: string;
  studentId: string | null;
  studentName: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; name: string };
  studentId: string | null;
  isRead: boolean;
  createdAt: string;
};

type TeacherGroup = {
  studentId: string;
  studentName: string;
  className: string;
  teachers: Array<{ userId: string; name: string; subjectName: string }>;
};

interface Props {
  userId: string;
  userRole: string;
  userName: string;
}

export function MessagesScreen({ userId, userRole, userName }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<{ otherId: string; studentId: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/messages/conversations");
    if (res.ok) setConversations(await res.json());
  }, []);

  const loadTeachers = useCallback(async () => {
    if (userRole !== "guardian") return;
    const res = await fetch("/api/messages/teachers");
    if (res.ok) setTeacherGroups(await res.json());
  }, [userRole]);

  useEffect(() => {
    loadConversations();
    loadTeachers();
  }, [loadConversations, loadTeachers]);

  useEffect(() => {
    if (!active) return;
    const params = new URLSearchParams({ with: active.otherId });
    if (active.studentId) params.set("student", active.studentId);
    fetch(`/api/messages?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(msgs => { setMessages(msgs); setTimeout(() => bottomRef.current?.scrollIntoView(), 50); });
  }, [active]);

  async function send() {
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    const body: Record<string, string> = { to: active.otherId, content: draft.trim() };
    if (active.studentId) body.studentId = active.studentId;
    const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setDraft("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConversations();
    }
    setSending(false);
  }

  function openConv(otherId: string, studentId: string | null) {
    setActive({ otherId, studentId });
    setMessages([]);
  }

  function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  function fmtTime(d: string) {
    const dt = new Date(d);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - dt.getTime()) / 86400000);
    if (diffDays === 0) return dt.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }

  const activeConv = active
    ? conversations.find(c => c.otherId === active.otherId && c.studentId === active.studentId)
    : null;

  const activeTeacher = active
    ? teacherGroups.flatMap(g => g.teachers.map(t => ({ ...t, studentName: g.studentName, className: g.className, studentId: g.studentId }))).find(t => t.userId === active.otherId && t.studentId === active.studentId)
    : null;

  const displayName = activeConv?.otherName ?? activeTeacher?.name ?? "";
  const displaySub  = activeConv?.studentName
    ? `Re: ${activeConv.studentName}`
    : activeTeacher
      ? `${activeTeacher.subjectName} · Re: ${activeTeacher.studentName}`
      : "";

  return (
    <div className={styles.root}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <nav className={styles.breadcrumb}>
            <span>School</span>
            <ChevronRight size={12} className={styles.breadcrumbSep} />
            <span className={styles.breadcrumbActive}>Messages</span>
          </nav>
          <h1 className={styles.title}>Messages</h1>
          <p className={styles.subtitle}>Communicate with teachers and staff regarding your children.</p>
        </div>
      </div>

      <div className={styles.mainLayout}>

        {/* Conversation list */}
        <div className={styles.convList}>
          <div className={styles.convListHeader}>Conversations</div>

          <div className={styles.convListScroll}>
            {conversations.map(conv => (
              <div
                key={`${conv.otherId}::${conv.studentId ?? ""}`}
                className={`${styles.convItem} ${active?.otherId === conv.otherId && active?.studentId === conv.studentId ? styles.convItemActive : ""}`}
                onClick={() => openConv(conv.otherId, conv.studentId)}
              >
                <div className={styles.convAvatar}>{initials(conv.otherName)}</div>
                <div className={styles.convBody}>
                  <div className={styles.convName}>{conv.otherName}</div>
                  {conv.studentName && <div className={styles.convSub}>Re: {conv.studentName}</div>}
                  <div className={styles.convPreview}>{conv.lastMessage}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={styles.convTime}>{fmtTime(conv.lastAt)}</span>
                  {conv.unread > 0 && <span className={styles.unreadBadge}>{conv.unread}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* New conversation (parent only) */}
          {userRole === "guardian" && teacherGroups.length > 0 && (
            <div className={styles.newConvSection}>
              <div className={styles.newConvLabel}>New Message</div>
              {teacherGroups.map(g => (
                <div key={g.studentId} className={styles.childGroup}>
                  <div className={styles.childGroupName}>{g.studentName} ({g.className})</div>
                  {g.teachers.map(t => (
                    <button
                      key={`${t.userId}::${g.studentId}`}
                      className={styles.teacherBtn}
                      onClick={() => openConv(t.userId, g.studentId)}
                    >
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>{initials(t.name)}</span>
                      <span>{t.name} — {t.subjectName}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thread panel */}
        {!active ? (
          <div className={styles.placeholder}>
            <MessageSquare size={40} className={styles.placeholderIcon} />
            <p>Select a conversation or start a new message</p>
          </div>
        ) : (
          <div className={styles.threadPanel}>
            {/* Thread header */}
            <div className={styles.threadHeader}>
              <div className={styles.threadAvatar}>{initials(displayName)}</div>
              <div>
                <div className={styles.threadName}>{displayName}</div>
                {displaySub && <div className={styles.threadSub}>{displaySub}</div>}
              </div>
            </div>

            {/* Messages */}
            <div className={styles.threadMessages}>
              {messages.length === 0 ? (
                <div className={styles.threadEmpty}>
                  <MessageSquare size={32} className={styles.threadEmptyIcon} />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""}`}>
                      <div>
                        <div className={`${styles.msgBubble} ${isMe ? styles.msgBubbleMe : styles.msgBubbleThem}`}>
                          {msg.content}
                        </div>
                        <div className={`${styles.msgMeta} ${isMe ? "" : styles.msgMetaThem}`}>
                          {fmtTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={styles.threadInput}>
              <textarea
                className={styles.textarea}
                placeholder={`Message ${displayName}…`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
              />
              <button className={styles.sendBtn} onClick={send} disabled={!draft.trim() || sending}>
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
