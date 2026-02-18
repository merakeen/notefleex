import { useMemo } from "react";
import DOMPurify from "dompurify";
import showdown from "showdown";

const converter = new showdown.Converter({
  tables: true,
  strikethrough: true,
  simplifiedAutoLink: true,
  tasklists: true,
});

function NoteDisplay({ markdown }) {
  const html = useMemo(() => {
    const generatedHtml = converter.makeHtml(markdown || "");
    return DOMPurify.sanitize(generatedHtml);
  }, [markdown]);

  return <article className="markdown-output" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default NoteDisplay;
