import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTaskStore } from "@/lib/store/useTaskStore";

import { SearchBar } from "./SearchBar";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Advancing fake timers past the debounce triggers a React state update
// (the store write re-renders SearchBar) outside of any event handler RTL
// already wraps -- act() makes sure that update is flushed and asserted on
// the same way a real browser interaction would be.
function advanceTimersByTime(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("SearchBar debounce behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    useTaskStore.setState({ searchQuery: "" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not write to the store immediately while typing", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search by title or customer…");

    fireEvent.change(input, { target: { value: "renewal" } });

    // The store shouldn't see this yet -- it's still within the 300ms
    // debounce window.
    expect(useTaskStore.getState().searchQuery).toBe("");
    expect(replace).not.toHaveBeenCalled();
  });

  it("writes to the store only after the debounce window elapses", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search by title or customer…");

    fireEvent.change(input, { target: { value: "renewal" } });
    advanceTimersByTime(299);
    expect(useTaskStore.getState().searchQuery).toBe("");

    advanceTimersByTime(1);
    expect(useTaskStore.getState().searchQuery).toBe("renewal");
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("resets the debounce timer on every keystroke rather than firing per key", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search by title or customer…");

    fireEvent.change(input, { target: { value: "r" } });
    advanceTimersByTime(200);
    fireEvent.change(input, { target: { value: "re" } });
    advanceTimersByTime(200);
    fireEvent.change(input, { target: { value: "ren" } });

    // Only 200ms since the last keystroke -- still debounced.
    advanceTimersByTime(200);
    expect(useTaskStore.getState().searchQuery).toBe("");

    // Now past 300ms since the *last* keystroke specifically.
    advanceTimersByTime(100);
    expect(useTaskStore.getState().searchQuery).toBe("ren");
    // One store write for the whole sequence, not one per keystroke.
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("clearing the search applies immediately, bypassing the debounce", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search by title or customer…");

    fireEvent.change(input, { target: { value: "renewal" } });
    advanceTimersByTime(300);
    expect(useTaskStore.getState().searchQuery).toBe("renewal");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(useTaskStore.getState().searchQuery).toBe("");
  });
});
