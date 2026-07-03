import { describe, it, beforeEach, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "@/App";

// Смоук: лаза-роут /asystent рендериться і показує порожній стан асистента
// (без звернень до серверного /api — привітання доступне одразу).
beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/asystent");
});

describe("App /asystent lazy route", () => {
  it("renders the assistant greeting via the lazy route", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getAllByText(/Туристичний асистент/i).length).toBeGreaterThan(0), {
      timeout: 8000,
    });
    expect(screen.getByPlaceholderText(/Напишіть повідомлення/i)).toBeInTheDocument();
  });
});
