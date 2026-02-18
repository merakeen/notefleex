import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Empty,
  Input,
  Layout,
  List,
  Modal,
  Space,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import MarkdownInput from "./MarkdownInput";
import NoteDisplay from "./NoteDisplay";
import "./App.css";

const NOTES_STORAGE_KEY = "notefleex.notes.v2";
const LEGACY_NOTES_STORAGE_KEY = "notes";

function readStoredNotes() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    window.localStorage.getItem(NOTES_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_NOTES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (note) =>
          note &&
          (typeof note.id === "string" || typeof note.id === "number")
      )
      .map((note) => ({
        id: String(note.id),
        title: typeof note.title === "string" ? note.title : "",
        content: typeof note.content === "string" ? note.content : "",
        updatedAt:
          typeof note.updatedAt === "string"
            ? note.updatedAt
            : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function createNewNote() {
  const now = new Date().toISOString();

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    title: "New note",
    content: "",
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

function App() {
  const [notes, setNotes] = useState(readStoredNotes);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewNoteId, setPreviewNoteId] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore storage write failures (e.g., private mode / quota exceeded).
    }
  }, [notes]);

  useEffect(() => {
    if (!notes.some((note) => note.id === activeNoteId)) {
      setActiveNoteId(notes[0]?.id ?? null);
    }
  }, [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return [...notes]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((note) => {
        if (!normalizedQuery) {
          return true;
        }

        return note.title.toLowerCase().includes(normalizedQuery);
      });
  }, [notes, searchTerm]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [notes, activeNoteId]
  );

  const previewNote = useMemo(
    () => notes.find((note) => note.id === previewNoteId) ?? null,
    [notes, previewNoteId]
  );

  function addNote() {
    const newNote = createNewNote();
    setNotes((prevNotes) => [newNote, ...prevNotes]);
    setActiveNoteId(newNote.id);
  }

  function updateActiveNote(changes) {
    if (!activeNoteId) {
      return;
    }

    setNotes((prevNotes) =>
      prevNotes.map((note) => {
        if (note.id !== activeNoteId) {
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

  function deleteNote(noteId) {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));

    if (previewNoteId === noteId) {
      setPreviewNoteId(null);
    }
  }

  return (
    <>
      <Layout className="app-layout">
        <Layout.Sider width={340} theme="light" className="app-sider">
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div className="sider-header">
              <Typography.Title level={3} style={{ margin: 0 }}>
                NoteFleex
              </Typography.Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={addNote}>
                New note
              </Button>
            </div>

            <Input
              placeholder="Search notes"
              allowClear
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {filteredNotes.length === 0 ? (
              <Empty
                className="notes-empty"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No matching notes"
              />
            ) : (
              <List
                className="notes-list"
                dataSource={filteredNotes}
                renderItem={(item) => (
                  <List.Item
                    className={`note-list-item ${
                      item.id === activeNoteId ? "active" : ""
                    }`}
                    onClick={() => setActiveNoteId(item.id)}
                    actions={[
                      <Button
                        key={`preview-${item.id}`}
                        type="text"
                        icon={<EyeOutlined />}
                        aria-label={`Preview ${item.title || "untitled note"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPreviewNoteId(item.id);
                        }}
                      />,
                      <Button
                        key={`delete-${item.id}`}
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Delete ${item.title || "untitled note"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteNote(item.id);
                        }}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      title={item.title || "Untitled"}
                      description={formatUpdatedAt(item.updatedAt)}
                    />
                  </List.Item>
                )}
              />
            )}
          </Space>
        </Layout.Sider>

        <Layout.Content className="app-content">
          {activeNote ? (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <MarkdownInput note={activeNote} onChange={updateActiveNote} />
              <section className="preview-section">
                <Typography.Title level={4}>Live preview</Typography.Title>
                <NoteDisplay markdown={activeNote.content} />
              </section>
            </Space>
          ) : (
            <Empty description="Create your first note to start writing." />
          )}
        </Layout.Content>
      </Layout>

      <Modal
        title={previewNote?.title || "Untitled"}
        open={Boolean(previewNoteId)}
        footer={null}
        width={820}
        onCancel={() => setPreviewNoteId(null)}
      >
        <NoteDisplay markdown={previewNote?.content || ""} />
      </Modal>
    </>
  );
}

export default App;
