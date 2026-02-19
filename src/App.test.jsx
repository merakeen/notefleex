import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const STORAGE_KEY = "notefleex.notes.v3";
const LEGACY_STORAGE_KEY = "notes";
const THEME_STORAGE_KEY = "notefleex.theme.v1";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the privacy-focused hero", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /notefleex/i })).toBeInTheDocument();
    expect(screen.getByText(/everything runs on your device/i)).toBeInTheDocument();
  });

  it("creates a note from the hero action", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /create note/i }));

    expect(screen.getByDisplayValue("Untitled note")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /editor/i })).toBeInTheDocument();
  });

  it("filters notes by search term", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "1",
          title: "Product plan",
          content: "roadmap and milestones",
          tags: ["planning"],
          pinned: false,
          archived: false,
          color: "#ffd0e1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          title: "Groceries",
          content: "milk eggs bread",
          tags: ["home"],
          pinned: false,
          archived: false,
          color: "#d8e7ff",
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ])
    );

    render(<App />);

    await user.type(screen.getByPlaceholderText(/search title, content, or tags/i), "plan");

    expect(screen.getByText("Product plan")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
  });

  it("reads legacy notes key for backward compatibility", () => {
    window.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify([
        {
          id: 10,
          title: "Legacy note",
          content: "still available",
        },
      ])
    );

    render(<App />);

    expect(screen.getByText("Legacy note")).toBeInTheDocument();
  });

  it("toggles between light and dark mode", async () => {
    const user = userEvent.setup();

    render(<App />);

    const modeSwitch = screen.getByRole("switch", { name: /toggle dark mode/i });
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    await user.click(modeSwitch);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });
});
