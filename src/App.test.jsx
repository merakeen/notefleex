import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const STORAGE_KEY = "notefleex.notes.v2";
const LEGACY_STORAGE_KEY = "notes";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows empty state before any note is created", () => {
    render(<App />);

    expect(
      screen.getByText(/create your first note to start writing/i)
    ).toBeInTheDocument();
  });

  it("creates a new note from the sidebar button", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /new note/i }));

    expect(screen.getByDisplayValue("New note")).toBeInTheDocument();
    expect(screen.getByText(/notes are saved automatically/i)).toBeInTheDocument();
  });

  it("filters notes by title", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "1",
          title: "Project Plan",
          content: "- align roadmap",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          title: "Groceries",
          content: "- milk",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ])
    );

    render(<App />);

    await user.type(screen.getByPlaceholderText(/search notes/i), "Project");

    expect(screen.getByText("Project Plan")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
  });

  it("reads notes from the legacy storage key", () => {
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([
        {
          id: 100,
          title: "Legacy note",
          content: "still available",
        },
      ])
    );

    render(<App />);

    expect(screen.getByText("Legacy note")).toBeInTheDocument();
  });
});
