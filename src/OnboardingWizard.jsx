import { useState } from "react";
import { Button, Typography } from "antd";
import { BookOutlined, FileAddOutlined, RocketOutlined } from "@ant-design/icons";
import NoteDisplay from "./NoteDisplay";

export const ONBOARDING_KEY = "notefleex.onboarded.v1";

const MARKDOWN_DEMO = `# My first note

**Bold text** makes things stand out.
*Italic* is great for emphasis.

- Item one
- Item two
- Item three

> A blockquote for important ideas.`;

const STEP_IDS = ["welcome", "markdown", "vaults", "note", "done"];

function StepDots({ current, total }) {
  return (
    <div className="ob-dots" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`ob-dot${i === current ? " ob-dot--active" : ""}`} />
      ))}
    </div>
  );
}

function OnboardingWizard({ open, onClose, onOpenTutorial, onCreateNote, onCreateVault }) {
  const [step, setStep] = useState(0);
  const [demoText, setDemoText] = useState(MARKDOWN_DEMO);

  const total = STEP_IDS.length;
  const currentStepId = STEP_IDS[step];

  function finish() {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // ignore
    }
    onClose();
  }

  function next() {
    if (step < total - 1) setStep((s) => s + 1);
    else finish();
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  if (!open) return null;

  return (
    <div className="ob-overlay" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      <div className="ob-card">
        <StepDots current={step} total={total} />

        {currentStepId === "welcome" && (
          <div className="ob-step">
            <div className="ob-icon">𖦹</div>
            <Typography.Title level={2} className="ob-title">
              Welcome to notefleex
            </Typography.Title>
            <Typography.Paragraph className="ob-body">
              notefleex is a private notes vault that lives entirely on your device. No account
              needed, no cloud, no tracking — your words stay with you.
            </Typography.Paragraph>
            <Typography.Paragraph className="ob-body">
              This short tour will show you the essentials in under 2 minutes. You can skip it at
              any time.
            </Typography.Paragraph>
            <div className="hero-badges ob-badges">
              <span>Local-first</span>
              <span>No cloud sync</span>
              <span>No trackers</span>
              <span>Full privacy</span>
            </div>
            <div className="ob-actions">
              <Button type="primary" size="large" block onClick={next}>
                Let's go →
              </Button>
              <Button type="text" size="small" onClick={finish}>
                Skip tour
              </Button>
            </div>
          </div>
        )}

        {currentStepId === "markdown" && (
          <div className="ob-step">
            <Typography.Title level={3} className="ob-title">
              notefleex speaks Markdown
            </Typography.Title>
            <Typography.Paragraph className="ob-body">
              You've probably seen Markdown before without knowing it. When you copy a ChatGPT
              response and see <strong>**asterisks around bold text**</strong> or{" "}
              <code># a heading</code> in the raw text — that's Markdown. It's a simple way to
              format text using plain characters.
            </Typography.Paragraph>
            <Typography.Paragraph className="ob-body ob-body--muted">
              In notefleex you type Markdown and it renders instantly. Try editing the box below:
            </Typography.Paragraph>
            <div className="ob-demo">
              <div className="ob-demo-col">
                <div className="ob-demo-label">You type</div>
                <textarea
                  className="ob-demo-input"
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  spellCheck={false}
                  aria-label="Markdown input demo"
                />
              </div>
              <div className="ob-demo-col">
                <div className="ob-demo-label">You get</div>
                <div className="ob-demo-render">
                  <NoteDisplay markdown={demoText} />
                </div>
              </div>
            </div>
            <div className="ob-nav">
              <Button onClick={back}>← Back</Button>
              <Button type="primary" onClick={next}>
                Next →
              </Button>
            </div>
          </div>
        )}

        {currentStepId === "vaults" && (
          <div className="ob-step">
            <Typography.Title level={3} className="ob-title">
              Vaults: your private spaces
            </Typography.Title>
            <Typography.Paragraph className="ob-body">
              Vaults are separate containers for your notes. You can have as many as you like, each
              with its own purpose and access control.
            </Typography.Paragraph>
            <div className="ob-vault-cards">
              <div className="ob-vault-card">
                <div className="ob-vault-card-icon">📁</div>
                <Typography.Title level={5} style={{ margin: "8px 0 4px" }}>
                  Default vault
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Always available, no password required. Perfect for everyday notes.
                </Typography.Text>
              </div>
              <div className="ob-vault-card ob-vault-card--enc">
                <div className="ob-vault-card-icon">🔒</div>
                <Typography.Title level={5} style={{ margin: "8px 0 4px" }}>
                  Encrypted vault
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Password-protected with AES-256 encryption. Notes are scrambled at rest.{" "}
                  <strong>No password recovery possible.</strong>
                </Typography.Text>
              </div>
            </div>
            <Typography.Paragraph className="ob-body ob-body--muted" style={{ marginTop: 14 }}>
              You already have the Default vault ready. You can create an encrypted vault at any
              time via the vault switcher in the notes panel.
            </Typography.Paragraph>
            <div className="ob-nav">
              <Button onClick={back}>← Back</Button>
              <div className="ob-nav-group">
                <Button
                  onClick={() => {
                    onCreateVault();
                    next();
                  }}
                >
                  Create a vault
                </Button>
                <Button type="primary" onClick={next}>
                  Skip for now →
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStepId === "note" && (
          <div className="ob-step">
            <Typography.Title level={3} className="ob-title">
              Create your first note
            </Typography.Title>
            <Typography.Paragraph className="ob-body">
              Each note has a <strong>title</strong>, <strong>content</strong> written in Markdown,
              and optional <strong>tags</strong> to find it later. Notes can be pinned, archived, or
              given a color at a glance.
            </Typography.Paragraph>
            <div className="ob-note-preview" aria-hidden="true">
              <div className="ob-note-preview-header">
                <span className="ob-note-dot" style={{ background: "#fde8d3" }} />
                <span className="ob-note-title-mock">My first note</span>
                <span className="ob-note-tag-mock">ideas</span>
              </div>
              <div className="ob-note-preview-body">Start writing your Markdown note here…</div>
            </div>
            <div className="ob-nav">
              <Button onClick={back}>← Back</Button>
              <div className="ob-nav-group">
                <Button onClick={next}>Skip</Button>
                <Button
                  type="primary"
                  icon={<FileAddOutlined />}
                  onClick={() => {
                    onCreateNote();
                    finish();
                  }}
                >
                  Create my first note
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStepId === "done" && (
          <div className="ob-step ob-step--center">
            <div className="ob-icon ob-icon--success">✓</div>
            <Typography.Title level={2} className="ob-title">
              You're all set!
            </Typography.Title>
            <Typography.Paragraph className="ob-body">
              notefleex is ready. What would you like to do next?
            </Typography.Paragraph>
            <div className="ob-final-cards">
              <button
                className="ob-final-card"
                onClick={() => {
                  finish();
                  onOpenTutorial();
                }}
              >
                <div className="ob-final-card-icon">
                  <BookOutlined />
                </div>
                <div className="ob-final-card-body">
                  <strong>Learn Markdown</strong>
                  <span>Open the full guide with live examples for every syntax element.</span>
                </div>
              </button>
              <button className="ob-final-card ob-final-card--primary" onClick={finish}>
                <div className="ob-final-card-icon">
                  <RocketOutlined />
                </div>
                <div className="ob-final-card-body">
                  <strong>Jump to the app</strong>
                  <span>Start writing right away. You can always open the guide later.</span>
                </div>
              </button>
            </div>
            <Button type="text" size="small" onClick={back} style={{ marginTop: 12 }}>
              ← Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingWizard;
