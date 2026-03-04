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
  BookOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
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
import { useRegisterSW } from "virtual:pwa-register/react";
import MarkdownInput from "./MarkdownInput";
import MarkdownTutorial from "./MarkdownTutorial";
import NoteDisplay from "./NoteDisplay";
import { generateSalt, deriveKey, encryptNotes, decryptNotes } from "./vaultCrypto";
import { VaultSwitcherButton, CreateVaultModal, UnlockVaultModal } from "./VaultManager";
import "./App.css";

const NOTES_STORAGE_KEY = "notefleex.notes.v3";
const THEME_STORAGE_KEY = "notefleex.theme.v1";
const LEGACY_STORAGE_KEYS = ["notefleex.notes.v2", "notes"];
const NOTE_COLORS = ["#fde8d3", "#d2f5e3", "#ead5f9", "#fef3c7", "#dbeafe", "#fce7f0"];

const VAULTS_REGISTRY_KEY = "notefleex.vaults.v1";
const DEFAULT_VAULT_ID = "default";
const vaultDataKey = (id) => `notefleex.vault.${id}`;

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

function initializeVaultsAndNotes() {
  if (typeof window === "undefined") {
    const defaultVault = {
      id: DEFAULT_VAULT_ID,
      name: "My Notes",
      encrypted: false,
      salt: null,
      createdAt: new Date().toISOString(),
    };
    return { vaults: [defaultVault], activeVaultId: DEFAULT_VAULT_ID, notes: [] };
  }

  // If the registry already exists, migration is done — load state from vault storage
  const existingRegistry = window.localStorage.getItem(VAULTS_REGISTRY_KEY);
  if (existingRegistry) {
    try {
      const vaults = JSON.parse(existingRegistry);
      const defaultVaultRaw = window.localStorage.getItem(vaultDataKey(DEFAULT_VAULT_ID));
      const defaultVaultData = defaultVaultRaw ? JSON.parse(defaultVaultRaw) : { notes: [] };
      const notes = (defaultVaultData.notes || [])
        .map((note, i) => normalizeNote(note, i))
        .filter(Boolean);
      return { vaults, activeVaultId: DEFAULT_VAULT_ID, notes };
    } catch {
      // Fall through to migration
    }
  }

  // First run — migrate existing notes into the default vault
  const legacyNotes = readStoredNotes();
  const now = new Date().toISOString();
  const defaultVault = {
    id: DEFAULT_VAULT_ID,
    name: "My Notes",
    encrypted: false,
    salt: null,
    createdAt: now,
  };

  try {
    window.localStorage.setItem(VAULTS_REGISTRY_KEY, JSON.stringify([defaultVault]));
    window.localStorage.setItem(
      vaultDataKey(DEFAULT_VAULT_ID),
      JSON.stringify({ encrypted: false, notes: legacyNotes })
    );
  } catch {
    // Storage write failed — proceed in-memory
  }

  return { vaults: [defaultVault], activeVaultId: DEFAULT_VAULT_ID, notes: legacyNotes };
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
  const [vaultState] = useState(initializeVaultsAndNotes);
  const [vaults, setVaults] = useState(vaultState.vaults);
  const [activeVaultId, setActiveVaultId] = useState(vaultState.activeVaultId);
  const [notes, setNotes] = useState(vaultState.notes);
  const [unlockedVaultKeys, setUnlockedVaultKeys] = useState(new Map());
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [themeMode, setThemeMode] = useState(readStoredThemeMode);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("all");
  const [previewNoteId, setPreviewNoteId] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [swDismissed, setSwDismissed] = useState(false);
  const fileInputRef = useRef(null);
  const justCreatedRef = useRef(false);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore theme persistence failures.
    }
  }, [themeMode]);

  useEffect(() => {
    const activeVaultMeta = vaults.find((v) => v.id === activeVaultId);
    if (!activeVaultMeta) return;

    if (!activeVaultMeta.encrypted) {
      try {
        window.localStorage.setItem(
          vaultDataKey(activeVaultId),
          JSON.stringify({ encrypted: false, notes })
        );
      } catch {
        // Ignore storage write failures.
      }
      return;
    }

    const key = unlockedVaultKeys.get(activeVaultId);
    if (!key) return;

    (async () => {
      try {
        const { iv, data } = await encryptNotes(notes, key);
        window.localStorage.setItem(
          vaultDataKey(activeVaultId),
          JSON.stringify({ encrypted: true, iv, data })
        );
      } catch {
        // Ignore encryption/storage failures.
      }
    })();
  }, [notes, activeVaultId, vaults, unlockedVaultKeys]);

  useEffect(() => {
    if (!notes.some((note) => note.id === activeNoteId)) {
      const firstActive = notes.find((note) => !note.archived);
      setActiveNoteId(firstActive?.id ?? notes[0]?.id ?? null);
    }
  }, [notes, activeNoteId]);

  // Reset to view mode when switching notes; auto-enter edit for newly created ones.
  useEffect(() => {
    if (justCreatedRef.current) {
      justCreatedRef.current = false;
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [activeNoteId]);

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

  async function switchVault(id) {
    if (id === activeVaultId) return;
    const meta = vaults.find((v) => v.id === id);
    if (!meta) return;

    if (!meta.encrypted) {
      try {
        const raw = window.localStorage.getItem(vaultDataKey(id));
        const data = raw ? JSON.parse(raw) : { notes: [] };
        setActiveVaultId(id);
        setNotes((data.notes || []).map((n, i) => normalizeNote(n, i)).filter(Boolean));
        setActiveNoteId(null);
        setMode("all");
        setSearchTerm("");
      } catch {
        message.error("Could not load vault.");
      }
      return;
    }

    const cachedKey = unlockedVaultKeys.get(id);
    if (cachedKey) {
      try {
        const raw = window.localStorage.getItem(vaultDataKey(id));
        const { iv, data } = JSON.parse(raw);
        const decryptedNotes = await decryptNotes(iv, data, cachedKey);
        setActiveVaultId(id);
        setNotes(decryptedNotes.map((n, i) => normalizeNote(n, i)).filter(Boolean));
        setActiveNoteId(null);
        setMode("all");
        setSearchTerm("");
      } catch {
        message.error("Could not decrypt vault.");
      }
      return;
    }

    setUnlockTarget(meta);
  }

  async function handleUnlockVault(vaultId, password) {
    const meta = vaults.find((v) => v.id === vaultId);
    if (!meta || !meta.salt) throw new Error("Vault not found");

    const key = await deriveKey(password, meta.salt);

    const raw = window.localStorage.getItem(vaultDataKey(vaultId));
    if (!raw) {
      setUnlockedVaultKeys((prev) => new Map(prev).set(vaultId, key));
      setActiveVaultId(vaultId);
      setNotes([]);
      setActiveNoteId(null);
      setMode("all");
      setSearchTerm("");
      setUnlockTarget(null);
      return;
    }

    const { iv, data } = JSON.parse(raw);
    const decryptedNotes = await decryptNotes(iv, data, key);

    setUnlockedVaultKeys((prev) => new Map(prev).set(vaultId, key));
    setActiveVaultId(vaultId);
    setNotes(decryptedNotes.map((n, i) => normalizeNote(n, i)).filter(Boolean));
    setActiveNoteId(null);
    setMode("all");
    setSearchTerm("");
    setUnlockTarget(null);
  }

  async function handleCreateVault(name, password) {
    const id = `vault_${Date.now()}`;
    const now = new Date().toISOString();
    let registryEntry;

    if (password) {
      const salt = generateSalt();
      const key = await deriveKey(password, salt);
      const { iv, data } = await encryptNotes([], key);
      window.localStorage.setItem(vaultDataKey(id), JSON.stringify({ encrypted: true, iv, data }));
      setUnlockedVaultKeys((prev) => new Map(prev).set(id, key));
      registryEntry = { id, name, encrypted: true, salt, createdAt: now };
    } else {
      window.localStorage.setItem(vaultDataKey(id), JSON.stringify({ encrypted: false, notes: [] }));
      registryEntry = { id, name, encrypted: false, salt: null, createdAt: now };
    }

    const updatedVaults = [...vaults, registryEntry];
    setVaults(updatedVaults);
    window.localStorage.setItem(VAULTS_REGISTRY_KEY, JSON.stringify(updatedVaults));
    setActiveVaultId(id);
    setNotes([]);
    setActiveNoteId(null);
    setMode("all");
    setSearchTerm("");
    setShowCreateVault(false);
  }

  function handleDeleteVault(id) {
    if (id === DEFAULT_VAULT_ID) {
      message.warning("The default vault cannot be deleted.");
      return;
    }

    window.localStorage.removeItem(vaultDataKey(id));
    setUnlockedVaultKeys((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    const updatedVaults = vaults.filter((v) => v.id !== id);
    setVaults(updatedVaults);
    window.localStorage.setItem(VAULTS_REGISTRY_KEY, JSON.stringify(updatedVaults));

    if (activeVaultId === id) {
      const defaultMeta = updatedVaults.find((v) => v.id === DEFAULT_VAULT_ID);
      if (defaultMeta) {
        switchVault(DEFAULT_VAULT_ID);
      }
    }
  }

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
    justCreatedRef.current = true;
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
            Your private notes workspace. Everything runs exclusively on your device. No account, no
            cloud storage: private on purpose.
          </Typography.Paragraph>

          <div className="hero-badges" aria-label="privacy guarantees">
            <span>Local-first</span>
            <span>No cloud sync</span>
            <span>No trackers</span>
            <span>Full privacy</span>
            <span>Manual backup possible</span>
          </div>

          <Space wrap className="hero-actions" size={10}>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={addNote}>
              Create note
            </Button>
            <Button size="large" icon={<BookOutlined />} onClick={() => setShowTutorial(true)}>
              Markdown guide
            </Button>
            <Button size="large" icon={<DownloadOutlined />} onClick={exportNotes}>
              Export as JSON backup file
            </Button>
            <Button
              size="large"
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import JSON backup file
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

            <div className="vault-switcher-row">
              <VaultSwitcherButton
                vaults={vaults}
                activeVaultId={activeVaultId}
                onSwitch={switchVault}
                onCreate={() => setShowCreateVault(true)}
                onDelete={handleDeleteVault}
              />
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
              isEditing ? (
                <>
                  <div className="editor-pane-header">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => setIsEditing(false)}
                    >
                      Done editing
                    </Button>
                    <Space size={4}>
                      {activeNote.pinned && <Tag color="gold">Pinned</Tag>}
                      {activeNote.archived && <Tag color="default">Archived</Tag>}
                      <Tag color="processing">{activeNote.tags.length} tags</Tag>
                    </Space>
                  </div>

                  <MarkdownInput
                    note={activeNote}
                    onChange={(changes) => mutateNote(activeNote.id, changes)}
                    onPreview={() => setPreviewNoteId(activeNote.id)}
                    onTogglePinned={() =>
                      mutateNote(activeNote.id, { pinned: !activeNote.pinned })
                    }
                    onToggleArchived={() =>
                      mutateNote(activeNote.id, { archived: !activeNote.archived })
                    }
                    onDelete={() => deleteNote(activeNote.id)}
                  />
                </>
              ) : (
                <div className="note-view">
                  <div className="note-view-toolbar">
                    <span className="note-view-date">
                      {formatUpdatedAt(activeNote.updatedAt)}
                    </span>
                    <Space size={2}>
                      <Button
                        type="text"
                        size="small"
                        icon={activeNote.pinned ? <PushpinFilled /> : <PushpinOutlined />}
                        aria-label={activeNote.pinned ? "Unpin" : "Pin"}
                        onClick={() =>
                          mutateNote(activeNote.id, { pinned: !activeNote.pinned })
                        }
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<InboxOutlined />}
                        aria-label={activeNote.archived ? "Restore" : "Archive"}
                        onClick={() =>
                          mutateNote(activeNote.id, { archived: !activeNote.archived })
                        }
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label="Delete note"
                        onClick={() => deleteNote(activeNote.id)}
                      />
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    </Space>
                  </div>

                  <h1 className="note-view-title">{activeNote.title || "Untitled"}</h1>

                  {activeNote.tags.length > 0 && (
                    <Space wrap className="note-view-tags">
                      {activeNote.tags.map((tag) => (
                        <Tag key={`view-${activeNote.id}-${tag}`}>{tag}</Tag>
                      ))}
                    </Space>
                  )}

                  {activeNote.content ? (
                    <NoteDisplay markdown={activeNote.content} />
                  ) : (
                    <div
                      className="note-view-placeholder"
                      role="button"
                      tabIndex={0}
                      onClick={() => setIsEditing(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setIsEditing(true);
                      }}
                    >
                      <Typography.Text type="secondary">
                        Nothing here yet — click Edit to start writing.
                      </Typography.Text>
                    </div>
                  )}
                </div>
              )
            ) : (
              <Empty description="Select a note or create one to start writing." />
            )}
          </main>
        </section>

        <footer className="app-footer">
          <div className="app-footer-divider" />
          <div className="app-footer-bottom">
            <Typography.Text className="app-footer-copy">
              © {new Date().getFullYear()} merakeen 𖦹 studio built/supported notefleex
            </Typography.Text>
          </div>
        </footer>

        <Modal
          open={Boolean(previewNoteId)}
          title={previewNote?.title || "Untitled"}
          footer={null}
          width={860}
          onCancel={() => setPreviewNoteId(null)}
        >
          <NoteDisplay markdown={previewNote?.content || ""} />
        </Modal>

        <MarkdownTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />

        <CreateVaultModal
          open={showCreateVault}
          onClose={() => setShowCreateVault(false)}
          onCreate={handleCreateVault}
        />

        <UnlockVaultModal
          vault={unlockTarget}
          onUnlock={handleUnlockVault}
          onCancel={() => setUnlockTarget(null)}
        />

        {needRefresh && !swDismissed && (
          <div className="sw-update-banner" role="alert">
            <span>A new version of notefleex is available.</span>
            <Button size="small" type="primary" onClick={() => updateServiceWorker(true)}>
              Update now
            </Button>
            <Button size="small" type="text" onClick={() => setSwDismissed(true)}>
              Later
            </Button>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
