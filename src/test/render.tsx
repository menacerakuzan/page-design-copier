import { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { LangProvider } from "@/lib/langContext";

/**
 * Render a page component mounted at a given route, with the same providers the
 * app uses (React Query + language + router). A fresh QueryClient per call keeps
 * tests isolated; retries are off so MSW responses resolve immediately.
 */
export function renderRoute(routePattern: string, initialPath: string, element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path={routePattern} element={element} />
          </Routes>
        </MemoryRouter>
      </LangProvider>
    </QueryClientProvider>,
  );
}
