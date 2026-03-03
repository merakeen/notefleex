import { useEffect, useState } from "react";
import {
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  PushpinFilled,
  PushpinOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Space, Tag, Typography } from "antd";

function parseTags(rawValue) {
  return rawValue
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function MarkdownInput({
  note,
  onChange,
  onPreview,
  onTogglePinned,
  onToggleArchived,
  onDelete,
}) {
  // Local draft avoids the controlled-input-eats-commas bug.
  // Parsed and saved only when the field loses focus.
  const [tagDraft, setTagDraft] = useState(() => note.tags.join(", "));

  // When a different note is selected, reset the draft to match.
  useEffect(() => {
    setTagDraft(note.tags.join(", "));
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="editor-card" variant="borderless">
      <div className="editor-toolbar">
        <Input
          size="large"
          placeholder="Untitled note"
          value={note.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />

        <Space wrap>
          <Button
            icon={note.pinned ? <PushpinFilled /> : <PushpinOutlined />}
            onClick={onTogglePinned}
          >
            {note.pinned ? "Pinned" : "Pin"}
          </Button>
          <Button icon={<EyeOutlined />} onClick={onPreview}>
            Full preview
          </Button>
          <Button
            icon={note.archived ? <RollbackOutlined /> : <InboxOutlined />}
            onClick={onToggleArchived}
          >
            {note.archived ? "Restore" : "Archive"}
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
            Delete
          </Button>
        </Space>
      </div>

      <Input.TextArea
        className="editor-textarea"
        placeholder="Write your note in markdown..."
        value={note.content}
        onChange={(event) => onChange({ content: event.target.value })}
        autoSize={{ minRows: 12, maxRows: 26 }}
      />

      <Input
        placeholder="Tags — comma separated (e.g. work, ideas, todo)"
        value={tagDraft}
        onChange={(event) => setTagDraft(event.target.value)}
        onBlur={(event) => onChange({ tags: parseTags(event.target.value) })}
      />

      {note.tags.length > 0 ? (
        <Space wrap className="tag-preview-row">
          {note.tags.map((tag) => (
            <Tag key={`${note.id}-${tag}`}>{tag}</Tag>
          ))}
        </Space>
      ) : (
        <Typography.Paragraph type="secondary" className="tag-empty-hint">
          Add tags to organize notes quickly.
        </Typography.Paragraph>
      )}
    </Card>
  );
}

export default MarkdownInput;
