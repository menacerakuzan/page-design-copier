import { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { LangProvider } from "@/lib/langContext";
import { WinterThemeProvider } from "@/lib/winterTheme";
import { BasketProvider } from "@/lib/basketContext";
import { MusicProvider } from "@/v2/lib/music";

/**
 * Render a page component mounted at a given route, with the same providers the
 * app uses (React Query + language + winter theme + basket + router + music). A fresh QueryClient per call keeps
 * tests isolated; retries are off so MSW responses resolve immediately.
 */
export function renderRoute(routePattern: string, initialPath: string, element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <WinterThemeProvider>
          <BasketProvider>
            <MemoryRouter initialEntries={[initialPath]}>
              <MusicProvider>
                <Routes>
                  <Route path={routePattern} element={element} />
                </Routes>
              </MusicProvider>
            </MemoryRouter>
          </BasketProvider>
        </WinterThemeProvider>
      </LangProvider>
    </QueryClientProvider>,
  );
}
