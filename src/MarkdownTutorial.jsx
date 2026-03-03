import { Divider, Modal, Typography } from "antd";
import NoteDisplay from "./NoteDisplay";

const SECTIONS = [
  {
    id: "headings",
    title: "Headings",
    description:
      "Start a line with # symbols to create headings. One # makes the biggest heading, up to #### for the smallest. Always leave a space after #.",
    input: "# Big Heading\n\n## Section Heading\n\n### Sub-section\n\n#### Small heading",
  },
  {
    id: "emphasis",
    title: "Bold, Italic & Strikethrough",
    description:
      "Wrap text with asterisks or underscores to style it. You can combine them for bold+italic.",
    input:
      "**This is bold**\n\n*This is italic*\n\n***Bold and italic***\n\n~~Strikethrough text~~",
  },
  {
    id: "lists",
    title: "Lists",
    description:
      "Use - or * for bullet points. Use 1. 2. 3. for numbered lists. Indent with two spaces to nest items inside another.",
    input:
      "- Milk\n- Eggs\n  - Free range\n- Bread\n\n1. Wake up\n2. Make coffee\n3. Start writing",
  },
  {
    id: "tasks",
    title: "Task Lists (Checkboxes)",
    description:
      "Use - [ ] for an unchecked box and - [x] for a checked one. Great for to-do lists and checklists.",
    input:
      "- [x] Buy groceries\n- [x] Call dentist\n- [ ] Finish project\n- [ ] Read a book",
  },
  {
    id: "links",
    title: "Links",
    description:
      "Use [display text](url) to create a clickable link. The text in brackets is what the reader sees; the URL in parentheses is where it goes.",
    input: "[Visit Wikipedia](https://wikipedia.org)\n\n[Go to top](#top)",
  },
  {
    id: "code",
    title: "Code",
    description:
      "Use single backticks for inline code. Use triple backticks on their own line for a code block — you can optionally add a language name for styling hints.",
    input:
      "Run `npm install` to install packages.\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```",
  },
  {
    id: "blockquote",
    title: "Blockquotes",
    description:
      "Start a line with > to create an indented quote block. Useful for highlighting important text, callouts, or citations.",
    input:
      "> The best time to plant a tree was 20 years ago.\n> The second best time is now.\n>\n> — Chinese Proverb",
  },
  {
    id: "table",
    title: "Tables",
    description:
      "Use | to separate columns and a row of dashes --- to create the header divider. The number of columns must match in every row.",
    input:
      "| Name    | Role      | City     |\n|---------|-----------|----------|\n| Alice   | Developer | New York |\n| Bob     | Designer  | London   |",
  },
  {
    id: "images",
    title: "Images",
    description:
      "Identical to link syntax but with a ! prefix. The text in brackets is the alt text shown if the image cannot load.",
    input: "![Placeholder image](https://picsum.photos/seed/notefleex/320/120)",
  },
  {
    id: "hr",
    title: "Horizontal Rule",
    description:
      "Place three or more dashes --- on their own line to draw a horizontal divider. Useful for separating sections.",
    input: "Section one ends here.\n\n---\n\nSection two begins here.",
  },
];

function MarkdownTutorial({ open, onClose }) {
  return (
    <Modal
      open={open}
      title="Markdown Guide — learn the basics"
      footer={null}
      width={860}
      onCancel={onClose}
      styles={{ body: { maxHeight: "76vh", overflowY: "auto", paddingTop: 8 } }}
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 20, fontSize: 14 }}>
        Markdown is a lightweight way to format text using plain characters. You write it in the
        editor and notefleex instantly renders it in the live preview. Here are all the building
        blocks:
      </Typography.Paragraph>

      {SECTIONS.map((section, index) => (
        <div key={section.id}>
          {index > 0 && <Divider style={{ margin: "18px 0" }} />}

          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
            {section.title}
          </Typography.Title>

          <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
            {section.description}
          </Typography.Paragraph>

          <div className="tutorial-example">
            <div className="tutorial-col">
              <div className="tutorial-label">You type</div>
              <pre className="tutorial-code">{section.input}</pre>
            </div>
            <div className="tutorial-col">
              <div className="tutorial-label">You get</div>
              <div className="tutorial-render">
                <NoteDisplay markdown={section.input} />
              </div>
            </div>
          </div>
        </div>
      ))}

      <Divider style={{ margin: "18px 0" }} />

      <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
        <strong>Tip:</strong> Combine these elements freely — bold inside a list, a link inside a
        table cell, code inside a blockquote. Markdown is designed to be readable even before it is
        rendered.
      </Typography.Paragraph>
    </Modal>
  );
}

export default MarkdownTutorial;
