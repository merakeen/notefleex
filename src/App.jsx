import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  ConfigProvider,
  Empty,
  Input,
  Modal,
  Segmented,
  Space,
  Switch,
  Tag,
  Typography,
  theme,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  InboxOutlined,
  MoonFilled,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
  SearchOutlined,
  SunFilled,
  UploadOutlined,
} from "@ant-design/icons";
import MarkdownInput from "./MarkdownInput";
import NoteDisplay from "./NoteDisplay";
import "./App.css";

const NOTES_STORAGE_KEY = "notefleex.notes.v3";
const THEME_STORAGE_KEY = "notefleex.theme.v1";
const LEGACY_STORAGE_KEYS = ["notefleex.notes.v2", "notes"];
const NOTE_COLORS = ["#b7d1f8", "#d8e8ff", "#a9c7f2", "#c5dcfa", "#e4eefc"];

function toTagArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeNote(note, index = 0) {
  if (!note || (typeof note !== "object" && typeof note !== "function")) {
    return null;
  }

  const createdAt =
    typeof note.createdAt === "string" ? note.createdAt : new Date().toISOString();
  const updatedAt =
    typeof note.updatedAt === "string" ? note.updatedAt : new Date().toISOString();
  const color =
    typeof note.color === "string" && note.color.length > 0
      ? note.color
      : NOTE_COLORS[index % NOTE_COLORS.length];

  if (typeof note.id !== "string" && typeof note.id !== "number") {
    return null;
  }

  return {
    id: String(note.id),
    title: typeof note.title === "string" ? note.title : "",
    content: typeof note.content === "string" ? note.content : "",
    tags: toTagArray(note.tags),
    pinned: Boolean(note.pinned),
    archived: Boolean(note.archived),
    color,
    createdAt,
    updatedAt,
  };
}

function getStoredPayload() {
  if (typeof window === "undefined") {
    return null;
  }

  const preferred = window.localStorage.getItem(NOTES_STORAGE_KEY);
  if (preferred) {
    return preferred;
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    const payload = window.localStorage.getItem(key);
    if (payload) {
      return payload;
    }
  }

  return null;
}

function readStoredNotes() {
  const raw = getStoredPayload();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((note, index) => normalizeNote(note, index))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readStoredThemeMode() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "light";
}

function createNewNote(index) {
  const now = new Date().toISOString();

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    title: "Untitled note",
    content: "",
    tags: [],
    pinned: false,
    archived: false,
    color: NOTE_COLORS[index % NOTE_COLORS.length],
    createdAt: now,
    updatedAt: now,
  };
}

function formatUpdatedAt(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Edited recently";
  }

  return `Edited ${date.toLocaleString()}`;
}

function buildSnippet(content) {
  if (!content) {
    return "Start writing your markdown note.";
  }

  return content.replace(/[#>*`\-]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function App() {
  const [notes, setNotes] = useState(readStoredNotes);
  const [themeMode, setThemeMode] = useState(readStoredThemeMode);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("all");
  const [previewNoteId, setPreviewNoteId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore theme persistence failures.
    }
  }, [themeMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore storage write failures.
    }
  }, [notes]);

  useEffect(() => {
    if (!notes.some((note) => note.id === activeNoteId)) {
      const firstActive = notes.find((note) => !note.archived);
      setActiveNoteId(firstActive?.id ?? notes[0]?.id ?? null);
    }
  }, [notes, activeNoteId]);

  const notesByMode = useMemo(() => {
    if (mode === "pinned") {
      return notes.filter((note) => !note.archived && note.pinned);
    }

    if (mode === "archived") {
      return notes.filter((note) => note.archived);
    }

    return notes.filter((note) => !note.archived);
  }, [notes, mode]);

  const filteredNotes = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return [...notesByMode]
      .filter((note) => {
        if (!normalizedQuery) {
          return true;
        }

        const searchBlob = `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase();
        return searchBlob.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return Number(b.pinned) - Number(a.pinned);
        }

        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [notesByMode, searchTerm]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [notes, activeNoteId]
  );

  const previewNote = useMemo(
    () => notes.find((note) => note.id === previewNoteId) ?? null,
    [notes, previewNoteId]
  );

  const stats = useMemo(
    () => ({
      all: notes.filter((note) => !note.archived).length,
      pinned: notes.filter((note) => !note.archived && note.pinned).length,
      archived: notes.filter((note) => note.archived).length,
    }),
    [notes]
  );

  const antdTheme = useMemo(() => {
    const isDark = themeMode === "dark";

    return {
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: "#5492e3",
        colorInfo: "#5492e3",
        colorTextBase: isDark ? "#f4ebec" : "#0f172b",
        colorBgBase: isDark ? "#090f1e" : "#f4ebec",
        colorBorder: isDark ? "#2a4672" : "#c7d5ea",
        borderRadius: 14,
        borderRadiusLG: 20,
        borderRadiusSM: 10,
        controlHeight: 40,
        fontFamily: '"Nunito Sans", "Segoe UI", Tahoma, sans-serif',
      },
      components: {
        Button: {
          controlHeight: 42,
          paddingInline: 18,
          fontWeight: 700,
          defaultBorderColor: isDark ? "#2a4672" : "#c7d5ea",
          defaultColor: isDark ? "#f4ebec" : "#0f172b",
        },
        Input: {
          controlHeight: 42,
          colorBgContainer: isDark ? "#0f172b" : "#ffffff",
          colorText: isDark ? "#f4ebec" : "#0f172b",
          colorTextPlaceholder: isDark ? "#aea3aa" : "#5d6882",
          activeBorderColor: "#5492e3",
          hoverBorderColor: "#5492e3",
        },
        Card: {
          colorBgContainer: isDark ? "#101b31" : "#ffffff",
        },
        Segmented: {
          itemActiveBg: isDark ? "#0f223f" : "#ffffff",
          itemSelectedBg: isDark ? "#0f223f" : "#ffffff",
          trackBg: isDark ? "#152645" : "#e8effc",
          itemColor: isDark ? "#c3d4ee" : "#2a4672",
          itemSelectedColor: isDark ? "#f4ebec" : "#0f172b",
        },
        Modal: {
          contentBg: isDark ? "#101b31" : "#ffffff",
          headerBg: isDark ? "#101b31" : "#ffffff",
          titleColor: isDark ? "#f4ebec" : "#0f172b",
        },
        Tag: {
          defaultBg: isDark ? "#1a2b4c" : "#edf4ff",
          defaultColor: isDark ? "#d8e6fb" : "#2a4672",
        },
      },
    };
  }, [themeMode]);

  function mutateNote(noteId, changes) {
    setNotes((previousNotes) =>
      previousNotes.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        return {
          ...note,
          ...changes,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }

  function addNote() {
    const newNote = createNewNote(notes.length);
    setNotes((previousNotes) => [newNote, ...previousNotes]);
    setMode("all");
    setActiveNoteId(newNote.id);
  }

  function deleteNote(noteId) {
    setNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId));

    if (activeNoteId === noteId) {
      setActiveNoteId(null);
    }

    if (previewNoteId === noteId) {
      setPreviewNoteId(null);
    }
  }

  function exportNotes() {
    if (notes.length === 0) {
      message.info("No notes to export yet.");
      return;
    }

    const blob = new Blob([JSON.stringify(notes, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `notefleex-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.success("Notes exported.");
  }

  function handleImport(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid format");
        }

        const importedNotes = parsed
          .map((note, index) => normalizeNote(note, index))
          .filter(Boolean);

        if (importedNotes.length === 0) {
          message.warning("No valid notes found in the imported file.");
          return;
        }

        setNotes((previousNotes) => {
          const merged = new Map(previousNotes.map((note) => [note.id, note]));
          importedNotes.forEach((note) => {
            merged.set(note.id, note);
          });

          return [...merged.values()];
        });

        setActiveNoteId(importedNotes[0].id);
        setMode("all");
        message.success(`Imported ${importedNotes.length} notes.`);
      } catch {
        message.error("Could not import file. Use a valid notefleex JSON export.");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="app-shell">
        <div className="theme-toggle">
          <span className="theme-toggle-icon" aria-hidden="true">
            {themeMode === "dark" ? <MoonFilled /> : <SunFilled />}
          </span>
          <span className="theme-toggle-label">{themeMode === "dark" ? "Dark mode" : "Light mode"}</span>
          <Switch
            size="small"
            checked={themeMode === "dark"}
            onChange={(checked) => setThemeMode(checked ? "dark" : "light")}
            aria-label="Toggle dark mode"
          />
        </div>

        <header className="hero-panel">
          <div className="hero-logo-frame">
            <img src="/favicon.svg" alt="notefleex logo" className="hero-logo" />
          </div>
          <Typography.Title level={1} className="hero-title">
            notefleex
          </Typography.Title>
          <Typography.Paragraph className="hero-subtitle">
            Your private notes workspace. Everything runs on your device, with no account and no
            cloud storage. Notes stay local in your browser only.
          </Typography.Paragraph>

          <div className="hero-badges" aria-label="privacy guarantees">
            <span>Local-first</span>
            <span>No cloud sync</span>
            <span>No trackers</span>
          </div>

          <Space wrap className="hero-actions" size={10}>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={addNote}>
              Create note
            </Button>
            <Button size="large" icon={<DownloadOutlined />} onClick={exportNotes}>
              Export JSON
            </Button>
            <Button
              size="large"
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import JSON
            </Button>
          </Space>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden-file-input"
            onChange={handleImport}
          />
        </header>

        <section className="workspace-grid">
          <aside className="notes-pane">
            <div className="notes-pane-header">
              <Typography.Title level={4}>Notes</Typography.Title>
              <Badge count={stats.all} color={themeMode === "dark" ? "#5492e3" : "#2a4672"} />
            </div>

            <Segmented
              size="large"
              className="mode-switch"
              value={mode}
              onChange={setMode}
              options={[
                { label: `All (${stats.all})`, value: "all" },
                { label: `Pinned (${stats.pinned})`, value: "pinned" },
                { label: `Archived (${stats.archived})`, value: "archived" },
              ]}
            />

            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search title, content, or tags"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {filteredNotes.length === 0 ? (
              <Empty
                className="notes-empty"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  mode === "archived"
                    ? "No archived notes yet"
                    : "No notes found. Create one to get started."
                }
              />
            ) : (
              <div className="note-list">
                {filteredNotes.map((note) => (
                  <article
                    key={note.id}
                    className={`note-tile ${note.id === activeNoteId ? "active" : ""}`}
                    style={{ "--tile-accent": note.color }}
                    onClick={() => setActiveNoteId(note.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveNoteId(note.id);
                      }
                    }}
                  >
                    <div className="note-tile-header">
                      <h3>{note.title || "Untitled"}</h3>
                      {note.pinned && <PushpinFilled className="pin-icon" />}
                    </div>

                    <p>{buildSnippet(note.content)}</p>

                    <div className="note-tag-row">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Tag key={`${note.id}-${tag}`}>{tag}</Tag>
                      ))}
                    </div>

                    <div className="note-tile-footer">
                      <span>{formatUpdatedAt(note.updatedAt)}</span>
                      <Space size={2}>
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          aria-label={`Preview ${note.title || "untitled note"}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewNoteId(note.id);
                          }}
                        />
                        <Button
                          type="text"
                          icon={note.pinned ? <PushpinFilled /> : <PushpinOutlined />}
                          aria-label={`${note.pinned ? "Unpin" : "Pin"} ${
                            note.title || "untitled note"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            mutateNote(note.id, { pinned: !note.pinned });
                          }}
                        />
                        <Button
                          type="text"
                          icon={<InboxOutlined />}
                          aria-label={`${note.archived ? "Restore" : "Archive"} ${
                            note.title || "untitled note"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            mutateNote(note.id, { archived: !note.archived });
                          }}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          aria-label={`Delete ${note.title || "untitled note"}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteNote(note.id);
                          }}
                        />
                      </Space>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>

          <main className="editor-pane">
            {activeNote ? (
              <>
                <div className="editor-pane-header">
                  <Typography.Title level={3}>Editor</Typography.Title>
                  <Space wrap>
                    {activeNote.pinned && <Tag color="gold">Pinned</Tag>}
                    {activeNote.archived && <Tag color="default">Archived</Tag>}
                    <Tag color="processing">{activeNote.tags.length} tags</Tag>
                  </Space>
                </div>

                <MarkdownInput
                  note={activeNote}
                  onChange={(changes) => mutateNote(activeNote.id, changes)}
                  onPreview={() => setPreviewNoteId(activeNote.id)}
                  onTogglePinned={() => mutateNote(activeNote.id, { pinned: !activeNote.pinned })}
                  onToggleArchived={() =>
                    mutateNote(activeNote.id, { archived: !activeNote.archived })
                  }
                  onDelete={() => deleteNote(activeNote.id)}
                />

                <section className="live-preview-panel">
                  <Typography.Title level={4}>Live markdown preview</Typography.Title>
                  <NoteDisplay markdown={activeNote.content} />
                </section>
              </>
            ) : (
              <Empty description="Select a note or create one to start writing." />
            )}
          </main>
        </section>

        <Modal
          open={Boolean(previewNoteId)}
          title={previewNote?.title || "Untitled"}
          footer={null}
          width={860}
          onCancel={() => setPreviewNoteId(null)}
        >
          <NoteDisplay markdown={previewNote?.content || ""} />
        </Modal>
      </div>
    </ConfigProvider>
  );
}

export default App;
