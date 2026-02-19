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
            Open preview
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
        placeholder="Tags (comma separated)"
        value={note.tags.join(", ")}
        onChange={(event) => onChange({ tags: parseTags(event.target.value) })}
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
