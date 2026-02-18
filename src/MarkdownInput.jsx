import { Card, Input, Typography } from "antd";

function MarkdownInput({ note, onChange }) {
  return (
    <Card className="editor-card" variant="borderless">
      <Typography.Title level={4}>Editor</Typography.Title>
      <Input
        placeholder="Note title"
        value={note.title}
        onChange={(event) => onChange({ title: event.target.value })}
        style={{ marginBottom: 12 }}
      />
      <Input.TextArea
        placeholder="Write your note in markdown..."
        value={note.content}
        onChange={(event) => onChange({ content: event.target.value })}
        autoSize={{ minRows: 10, maxRows: 20 }}
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
        Notes are saved automatically.
      </Typography.Paragraph>
    </Card>
  );
}

export default MarkdownInput;
