import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⬇ ここにSupabaseのURLとキーを入力してください ⬇
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SUPABASE_URL = "https://gztmshxdtcjwsxkckhlt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dG1zaHhkdGNqd3N4a2NraGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTU1MzIsImV4cCI6MjA4NjIzMTUzMn0.a_cnZJyN9SbtA9ThVwZHKFqf9GGVQi8XzvclcKAntKM";
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const api = {
  async fetchTasks() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?order=start_date.asc`, { headers: supabaseHeaders });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },
  async createTask(task) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
      method: "POST", headers: supabaseHeaders,
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },
  async updateTask(id, task) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`, {
      method: "PATCH", headers: supabaseHeaders,
      body: JSON.stringify({ ...task, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
  },
  async deleteTask(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`, {
      method: "DELETE", headers: supabaseHeaders,
    });
    if (!res.ok) throw new Error("Failed to delete task");
  },
  async fetchMembers() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/members?order=created_at.asc`, { headers: supabaseHeaders });
    if (!res.ok) throw new Error("Failed to fetch members");
    return res.json();
  },
  async addMember(name) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/members`, {
      method: "POST", headers: supabaseHeaders,
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to add member");
    return res.json();
  },
  async deleteMember(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/members?id=eq.${id}`, {
      method: "DELETE", headers: supabaseHeaders,
    });
    if (!res.ok) throw new Error("Failed to delete member");
  },
};

// ─── Constants ────────────────────────────────
const MEMBER_COLORS = [
  { bg: "#E8F5E9", bar: "#43A047", text: "#2E7D32", accent: "#A5D6A7" },
  { bg: "#E3F2FD", bar: "#1E88E5", text: "#1565C0", accent: "#90CAF9" },
  { bg: "#FFF3E0", bar: "#FB8C00", text: "#E65100", accent: "#FFCC80" },
  { bg: "#F3E5F5", bar: "#8E24AA", text: "#6A1B9A", accent: "#CE93D8" },
  { bg: "#E0F7FA", bar: "#00ACC1", text: "#00838F", accent: "#80DEEA" },
  { bg: "#FBE9E7", bar: "#F4511E", text: "#BF360C", accent: "#FFAB91" },
  { bg: "#F1F8E9", bar: "#7CB342", text: "#558B2F", accent: "#C5E1A5" },
  { bg: "#EDE7F6", bar: "#5E35B1", text: "#4527A0", accent: "#B39DDB" },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "未着手", color: "#9E9E9E", icon: "○" },
  { value: "in_progress", label: "進行中", color: "#1E88E5", icon: "◐" },
  { value: "done", label: "完了", color: "#43A047", icon: "●" },
];

const formatDate = (d) => { const date = new Date(d); return `${date.getMonth() + 1}/${date.getDate()}`; };
const toDateStr = (d) => { const date = new Date(d); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const addDays = (d, n) => { const date = new Date(d); date.setDate(date.getDate() + n); return date; };

// ─── Setup Screen ─────────────────────────────
function SetupScreen() {
  return (
    <div style={{
      fontFamily: "'Noto Sans JP', sans-serif", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{
        background: "#fff", borderRadius: 20, padding: "48px 44px",
        maxWidth: 560, width: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: "#1E293B",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>📋</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#1E293B" }}>TaskBoard</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>初期セットアップ</p>
          </div>
        </div>

        <div style={{
          background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12,
          padding: "16px 20px", marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: "#92400E", fontWeight: 600 }}>
            ⚠️ Supabaseの設定が必要です
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#A16207", lineHeight: 1.7 }}>
            このアプリを使うには、コード内の <code style={{ background: "#FEF3C7", padding: "2px 6px", borderRadius: 4 }}>SUPABASE_URL</code> と <code style={{ background: "#FEF3C7", padding: "2px 6px", borderRadius: 4 }}>SUPABASE_ANON_KEY</code> を設定してください。
          </p>
        </div>

        <div style={{ fontSize: 14, color: "#475569", lineHeight: 2 }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>セットアップ手順：</p>
          <div style={{ paddingLeft: 4 }}>
            <p>① <a href="https://supabase.com" target="_blank" style={{ color: "#1E88E5" }}>supabase.com</a> で無料アカウント作成</p>
            <p>② 新しいプロジェクトを作成（リージョン: Tokyo推奨）</p>
            <p>③ SQL Editorでテーブルを作成（セットアップガイド参照）</p>
            <p>④ Project Settings → API からURLとanonキーを取得</p>
            <p>⑤ コードの先頭にある変数に値をセット</p>
          </div>
        </div>

        <div style={{
          background: "#F1F5F9", borderRadius: 10, padding: "14px 18px",
          marginTop: 20, fontFamily: "monospace", fontSize: 12, color: "#64748B",
          lineHeight: 1.8,
        }}>
          {`const SUPABASE_URL = "https://xxx.supabase.co";`}<br />
          {`const SUPABASE_ANON_KEY = "eyJhbGci...";`}
        </div>
      </div>
    </div>
  );
}

// ─── Toast Notification ───────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 2000,
      background: type === "error" ? "#DC2626" : "#1E293B",
      color: "#fff", padding: "12px 20px", borderRadius: 12,
      fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      fontFamily: "'Noto Sans JP', sans-serif",
      animation: "fadeIn 0.3s ease",
    }}>{message}</div>
  );
}

// ─── Sync Indicator ───────────────────────────
function SyncIndicator({ syncing, lastSync }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 11, color: syncing ? "#1E88E5" : "#94A3B8",
      fontWeight: 500,
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: syncing ? "#1E88E5" : "#43A047",
        animation: syncing ? "pulse 1s infinite" : "none",
      }} />
      {syncing ? "同期中..." : lastSync ? `最終同期 ${lastSync}` : "接続済み"}
    </div>
  );
}

// ─── Modal ────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, padding: "32px 36px",
          width: "min(520px, 92vw)", boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
          animation: "modalIn 0.25s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", margin: 0, fontFamily: "'Noto Sans JP', sans-serif" }}>{title}</h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: "none",
            background: "#F1F5F9", cursor: "pointer", fontSize: 18,
            color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Task Form ────────────────────────────────
function TaskForm({ task, members, onSave, onCancel, onDelete, saving }) {
  const today = toDateStr(new Date());
  const weekLater = toDateStr(addDays(new Date(), 7));
  const [form, setForm] = useState(
    task ? {
      title: task.title, assignee: task.assignee,
      startDate: task.start_date, dueDate: task.due_date,
      status: task.status, description: task.description || "",
    } : { title: "", assignee: members[0]?.name || "", startDate: today, dueDate: weekLater, status: "not_started", description: "" }
  );

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #E2E8F0", fontSize: 14, fontFamily: "'Noto Sans JP', sans-serif",
    outline: "none", background: "#FAFBFC", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6, display: "block", letterSpacing: "0.03em" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <label style={labelStyle}>タスク名 *</label>
        <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例：デザインレビュー" autoFocus />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>担当者</label>
          <select style={{ ...inputStyle, cursor: "pointer" }} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
            {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>ステータス</label>
          <select style={{ ...inputStyle, cursor: "pointer" }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>開始日</label>
          <input type="date" style={inputStyle} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>期日</label>
          <input type="date" style={inputStyle} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>メモ（任意）</label>
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="補足事項があれば..." />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        {task && onDelete && (
          <button onClick={() => onDelete(task.id)} disabled={saving} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "#FEE2E2", color: "#DC2626", fontWeight: 600,
            cursor: "pointer", fontSize: 13, marginRight: "auto", fontFamily: "'Noto Sans JP', sans-serif",
            opacity: saving ? 0.6 : 1,
          }}>削除</button>
        )}
        <button onClick={onCancel} style={{
          padding: "10px 22px", borderRadius: 10, border: "1.5px solid #E2E8F0",
          background: "#fff", color: "#64748B", fontWeight: 600,
          cursor: "pointer", fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif",
        }}>キャンセル</button>
        <button
          onClick={() => { if (!form.title.trim()) return; onSave(form); }}
          disabled={saving || !form.title.trim()}
          style={{
            padding: "10px 28px", borderRadius: 10, border: "none",
            background: form.title.trim() && !saving ? "#1E293B" : "#CBD5E1",
            color: "#fff", fontWeight: 600, cursor: form.title.trim() && !saving ? "pointer" : "default",
            fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >{saving ? "保存中..." : task ? "更新" : "作成"}</button>
      </div>
    </div>
  );
}

// ─── Member Manager ───────────────────────────
function MemberManager({ members, onAdd, onRemove }) {
  const [newName, setNewName] = useState("");
  const inputStyle = {
    padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0",
    fontSize: 14, fontFamily: "'Noto Sans JP', sans-serif", outline: "none",
    background: "#FAFBFC", flex: 1,
  };
  const handleAdd = () => {
    if (newName.trim() && !members.find((m) => m.name === newName.trim())) {
      onAdd(newName.trim());
      setNewName("");
    }
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {members.map((m, i) => {
          const c = MEMBER_COLORS[i % MEMBER_COLORS.length];
          return (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: c.bg, padding: "6px 10px 6px 14px", borderRadius: 20,
              fontSize: 13, fontWeight: 600, color: c.text,
            }}>
              <span>{m.name}</span>
              <button onClick={() => onRemove(m.id)} style={{
                width: 20, height: 20, borderRadius: "50%", border: "none",
                background: "rgba(0,0,0,0.08)", cursor: "pointer", fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center", color: c.text,
              }}>×</button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input style={inputStyle} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新しいメンバー名"
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }} />
        <button onClick={handleAdd} style={{
          padding: "10px 20px", borderRadius: 10, border: "none",
          background: "#1E293B", color: "#fff", fontWeight: 600,
          cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", fontFamily: "'Noto Sans JP', sans-serif",
        }}>追加</button>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────
function FilterBar({ members, filter, onFilter }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button onClick={() => onFilter({ ...filter, assignee: null })} style={{
        padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        border: filter.assignee === null ? "2px solid #1E293B" : "1.5px solid #E2E8F0",
        background: filter.assignee === null ? "#1E293B" : "#fff",
        color: filter.assignee === null ? "#fff" : "#64748B",
        cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
      }}>全員</button>
      {members.map((m, i) => {
        const c = MEMBER_COLORS[i % MEMBER_COLORS.length];
        const active = filter.assignee === m.name;
        return (
          <button key={m.id} onClick={() => onFilter({ ...filter, assignee: active ? null : m.name })} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: active ? `2px solid ${c.bar}` : "1.5px solid #E2E8F0",
            background: active ? c.bg : "#fff", color: active ? c.text : "#64748B",
            cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
          }}>{m.name}</button>
        );
      })}
    </div>
  );
}

// ─── Main App ─────────────────────────────────
export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState({ assignee: null, status: null });
  const [view, setView] = useState("timeline");
  const timelineRef = useRef(null);

  if (!isConfigured) return <SetupScreen />;

  const showToast = (message, type = "success") => setToast({ message, type });

  const refresh = useCallback(async (silent = false) => {
    try {
      if (!silent) setSyncing(true);
      const [t, m] = await Promise.all([api.fetchTasks(), api.fetchMembers()]);
      setTasks(t);
      setMembers(m);
      setLastSync(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      if (!silent) showToast("データの取得に失敗しました", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  // Initial load + polling every 3 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh(true), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const memberNames = useMemo(() => members.map((m) => m.name), [members]);
  const memberColor = (name) => {
    const idx = memberNames.indexOf(name);
    return MEMBER_COLORS[(idx >= 0 ? idx : 0) % MEMBER_COLORS.length];
  };

  const saveTask = async (form) => {
    setSaving(true);
    try {
      const payload = {
        title: form.title, assignee: form.assignee,
        start_date: form.startDate, due_date: form.dueDate,
        status: form.status, description: form.description || "",
      };
      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
        showToast("タスクを更新しました");
      } else {
        await api.createTask(payload);
        showToast("タスクを作成しました");
      }
      await refresh(true);
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (e) {
      showToast("保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    setSaving(true);
    try {
      await api.deleteTask(id);
      showToast("タスクを削除しました");
      await refresh(true);
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (e) {
      showToast("削除に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (name) => {
    try {
      await api.addMember(name);
      await refresh(true);
      showToast(`${name} を追加しました`);
    } catch (e) {
      showToast("メンバーの追加に失敗しました", "error");
    }
  };

  const removeMember = async (id) => {
    try {
      await api.deleteMember(id);
      await refresh(true);
      showToast("メンバーを削除しました");
    } catch (e) {
      showToast("メンバーの削除に失敗しました", "error");
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter.assignee && t.assignee !== filter.assignee) return false;
      if (filter.status && t.status !== filter.status) return false;
      return true;
    });
  }, [tasks, filter]);

  const timelineData = useMemo(() => {
    if (filteredTasks.length === 0) return null;
    const allDates = filteredTasks.flatMap((t) => [new Date(t.start_date), new Date(t.due_date)]);
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const start = addDays(minDate, -3);
    const end = addDays(maxDate, 3);
    const totalDays = daysBetween(start, end) + 1;

    const months = [];
    let d = new Date(start);
    let lastMonth = -1;
    while (d <= end) {
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        months.push({ label: `${d.getFullYear()}年${d.getMonth() + 1}月`, offset: daysBetween(start, d), span: 0 });
      }
      if (months.length > 0) months[months.length - 1].span++;
      d = addDays(d, 1);
    }

    const todayOffset = daysBetween(start, new Date());
    return { start, end, totalDays, months, todayOffset };
  }, [filteredTasks]);

  const DAY_WIDTH = 36;

  const statusCounts = useMemo(() => {
    const c = { not_started: 0, in_progress: 0, done: 0 };
    tasks.forEach((t) => c[t.status]++);
    return c;
  }, [tasks]);

  if (loading) {
    return (
      <div style={{
        fontFamily: "'Noto Sans JP', sans-serif", minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "#F8FAFC", gap: 16,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ width: 40, height: 40, border: "3px solid #E2E8F0", borderTopColor: "#1E293B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 600 }}>データを読み込み中...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#1E293B" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E8ECF1",
        padding: "14px 28px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#1E293B",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>📋</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>TaskBoard</h1>
            <SyncIndicator syncing={syncing} lastSync={lastSync} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, marginRight: 12 }}>
            {STATUS_OPTIONS.map((s) => (
              <div key={s.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748B" }}>
                <span style={{ color: s.color, fontSize: 14 }}>{s.icon}</span>
                <span style={{ fontWeight: 600 }}>{statusCounts[s.value]}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowMemberModal(true)} style={{
            padding: "8px 16px", borderRadius: 10, border: "1.5px solid #E2E8F0",
            background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
            color: "#64748B", fontFamily: "'Noto Sans JP', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
          }}><span style={{ fontSize: 15 }}>👥</span> メンバー</button>
          <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} style={{
            padding: "8px 20px", borderRadius: 10, border: "none",
            background: "#1E293B", color: "#fff", fontWeight: 600,
            fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 2px 8px rgba(30,41,59,0.2)",
          }}><span style={{ fontSize: 16 }}>+</span> タスク追加</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <FilterBar members={members} filter={filter} onFilter={setFilter} />
        <div style={{ display: "flex", gap: 4, background: "#E8ECF1", borderRadius: 10, padding: 3 }}>
          {[{ key: "timeline", label: "タイムライン" }, { key: "list", label: "リスト" }].map((v) => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              padding: "6px 16px", borderRadius: 8, border: "none",
              background: view === v.key ? "#fff" : "transparent",
              boxShadow: view === v.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              fontWeight: 600, fontSize: 12, cursor: "pointer", color: "#1E293B", fontFamily: "'Noto Sans JP', sans-serif",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ padding: "0 28px 12px", display: "flex", gap: 6 }}>
        {[{ value: null, label: "全ステータス" }, ...STATUS_OPTIONS].map((s) => (
          <button key={s.value || "all"} onClick={() => setFilter({ ...filter, status: filter.status === s.value ? null : s.value })} style={{
            padding: "4px 12px", borderRadius: 16, fontSize: 11, fontWeight: 600,
            border: filter.status === s.value ? `1.5px solid ${s.color || "#1E293B"}` : "1.5px solid transparent",
            background: filter.status === s.value ? (s.value ? `${s.color}18` : "#1E293B10") : "#fff",
            color: filter.status === s.value ? (s.color || "#1E293B") : "#94A3B8",
            cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif",
          }}>{s.icon ? `${s.icon} ` : ""}{s.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 28px 40px" }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#64748B", margin: "0 0 6px" }}>
              {tasks.length === 0 ? "タスクがまだありません" : "該当するタスクがありません"}
            </p>
            <p style={{ fontSize: 13, color: "#94A3B8" }}>
              {tasks.length === 0 ? "「+ タスク追加」からタスクを作成しましょう" : "フィルタを変更してみてください"}
            </p>
          </div>
        ) : view === "timeline" && timelineData ? (
          <div style={{
            background: "#fff", borderRadius: 16, border: "1px solid #E8ECF1",
            overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "fadeIn 0.3s ease",
          }}>
            <div style={{ overflowX: "auto" }} ref={timelineRef}>
              <div style={{ minWidth: timelineData.totalDays * DAY_WIDTH + 220 }}>
                {/* Month header */}
                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ width: 220, minWidth: 220, borderRight: "1px solid #F1F5F9", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>タスク</div>
                  <div style={{ display: "flex", flex: 1 }}>
                    {timelineData.months.map((m, i) => (
                      <div key={i} style={{ width: m.span * DAY_WIDTH, minWidth: m.span * DAY_WIDTH, padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#475569", borderRight: "1px solid #F1F5F9" }}>{m.label}</div>
                    ))}
                  </div>
                </div>
                {/* Day header */}
                <div style={{ display: "flex", borderBottom: "1px solid #E8ECF1" }}>
                  <div style={{ width: 220, minWidth: 220, borderRight: "1px solid #F1F5F9" }} />
                  <div style={{ display: "flex", position: "relative" }}>
                    {Array.from({ length: timelineData.totalDays }, (_, i) => {
                      const d = addDays(timelineData.start, i);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const isToday = toDateStr(d) === toDateStr(new Date());
                      return (
                        <div key={i} style={{
                          width: DAY_WIDTH, minWidth: DAY_WIDTH, textAlign: "center",
                          padding: "6px 0", fontSize: 10, fontWeight: isToday ? 800 : 500,
                          color: isToday ? "#1E88E5" : isWeekend ? "#CBD5E1" : "#94A3B8",
                          background: isToday ? "#E3F2FD" : "transparent", borderRadius: isToday ? 6 : 0,
                        }}>{d.getDate()}</div>
                      );
                    })}
                  </div>
                </div>
                {/* Task rows */}
                {filteredTasks.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).map((task, idx) => {
                  const c = memberColor(task.assignee);
                  const startOffset = daysBetween(timelineData.start, task.start_date);
                  const duration = daysBetween(task.start_date, task.due_date) + 1;
                  const status = STATUS_OPTIONS.find((s) => s.value === task.status);
                  const isOverdue = new Date(task.due_date) < new Date() && task.status !== "done";
                  return (
                    <div key={task.id} style={{
                      display: "flex", borderBottom: "1px solid #F8FAFC", cursor: "pointer",
                      transition: "background 0.15s", animation: `fadeIn 0.3s ease ${idx * 0.04}s both`,
                    }} onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#FAFBFE"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <div style={{
                        width: 220, minWidth: 220, padding: "10px 16px", borderRight: "1px solid #F1F5F9",
                        display: "flex", flexDirection: "column", justifyContent: "center",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: status.color }}>{status.icon}</span>
                          <span style={{
                            fontSize: 13, fontWeight: 600, color: "#1E293B",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            textDecoration: task.status === "done" ? "line-through" : "none",
                            opacity: task.status === "done" ? 0.6 : 1,
                          }}>{task.title}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: c.text, background: c.bg, padding: "1px 8px", borderRadius: 10 }}>{task.assignee}</span>
                          {isOverdue && <span style={{ fontSize: 9, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "1px 6px", borderRadius: 8 }}>期限超過</span>}
                        </div>
                      </div>
                      <div style={{ position: "relative", flex: 1, height: 56 }}>
                        {Array.from({ length: timelineData.totalDays }, (_, i) => {
                          const d = addDays(timelineData.start, i);
                          if (d.getDay() !== 0 && d.getDay() !== 6) return null;
                          return <div key={i} style={{ position: "absolute", left: i * DAY_WIDTH, top: 0, width: DAY_WIDTH, height: "100%", background: "#F8FAFC" }} />;
                        })}
                        {timelineData.todayOffset >= 0 && timelineData.todayOffset < timelineData.totalDays && (
                          <div style={{ position: "absolute", left: timelineData.todayOffset * DAY_WIDTH + DAY_WIDTH / 2, top: 0, width: 2, height: "100%", background: "#1E88E5", opacity: 0.3, zIndex: 1 }} />
                        )}
                        <div style={{
                          position: "absolute", left: startOffset * DAY_WIDTH + 2, top: 14, height: 28,
                          width: Math.max(duration * DAY_WIDTH - 4, 20),
                          background: task.status === "done" ? `${c.bar}40` : c.bar,
                          borderRadius: 8, display: "flex", alignItems: "center", paddingLeft: 10,
                          fontSize: 11, fontWeight: 600, color: "#fff", overflow: "hidden", whiteSpace: "nowrap",
                          zIndex: 2, boxShadow: `0 2px 6px ${c.bar}30`, transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "scaleY(1.12)"; e.currentTarget.style.boxShadow = `0 4px 12px ${c.bar}40`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "scaleY(1)"; e.currentTarget.style.boxShadow = `0 2px 6px ${c.bar}30`; }}>
                          {duration * DAY_WIDTH > 80 && <span style={{ opacity: 0.95 }}>{formatDate(task.start_date)} – {formatDate(task.due_date)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fadeIn 0.3s ease" }}>
            {filteredTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map((task, idx) => {
              const c = memberColor(task.assignee);
              const status = STATUS_OPTIONS.find((s) => s.value === task.status);
              const isOverdue = new Date(task.due_date) < new Date() && task.status !== "done";
              return (
                <div key={task.id} onClick={() => { setEditingTask(task); setShowTaskModal(true); }} style={{
                  background: "#fff", borderRadius: 14, padding: "16px 20px",
                  border: "1px solid #E8ECF1", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 16,
                  transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  animation: `fadeIn 0.3s ease ${idx * 0.04}s both`,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.bar; e.currentTarget.style.boxShadow = `0 2px 12px ${c.bar}15`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8ECF1"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)"; }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, background: `${status.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: status.color, flexShrink: 0,
                  }}>{status.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: "#1E293B",
                      textDecoration: task.status === "done" ? "line-through" : "none",
                      opacity: task.status === "done" ? 0.6 : 1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.description}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.text, background: c.bg, padding: "4px 12px", borderRadius: 20, flexShrink: 0 }}>{task.assignee}</span>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? "#DC2626" : "#64748B" }}>
                      {formatDate(task.start_date)} – {formatDate(task.due_date)}
                    </div>
                    {isOverdue && <div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginTop: 2 }}>期限超過</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showTaskModal} onClose={() => { setShowTaskModal(false); setEditingTask(null); }} title={editingTask ? "タスクを編集" : "新しいタスク"}>
        <TaskForm task={editingTask} members={members} onSave={saveTask} onCancel={() => { setShowTaskModal(false); setEditingTask(null); }} onDelete={editingTask ? deleteTask : null} saving={saving} />
      </Modal>
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="メンバー管理">
        <MemberManager members={members} onAdd={addMember} onRemove={removeMember} />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
