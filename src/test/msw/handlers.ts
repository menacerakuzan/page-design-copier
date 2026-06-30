import { http, HttpResponse } from "msw";

/**
 * In-memory PostgREST stand-in. Tests set `tableData[<table>]` to control what
 * the data layer receives, and read `capturedRequests` to assert the outgoing
 * HTTP contract (path + query string + method). Mocking at the HTTP boundary
 * (not the supabase-js module) keeps these tests valid after the planned
 * supabase-js → custom fetch client swap.
 */
export const tableData: Record<string, unknown[]> = {};

export interface CapturedRequest {
  method: string;
  table: string;
  search: string; // raw query string, e.g. "select=*&page_key=eq.index"
  body: unknown;
}
export const capturedRequests: CapturedRequest[] = [];

export function resetMsw() {
  for (const k of Object.keys(tableData)) delete tableData[k];
  capturedRequests.length = 0;
}

async function capture(request: Request, table: string) {
  let body: unknown = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.clone().json();
    } catch {
      body = undefined;
    }
  }
  const url = new URL(request.url);
  capturedRequests.push({ method: request.method, table, search: url.searchParams.toString(), body });
}

const REST = "*/rest/v1/:table";

export const handlers = [
  // OpenWeather (used by useWeather) — minimal valid payload so smoke renders
  // don't trip the "unhandled request" guard.
  http.get("https://api.openweathermap.org/data/2.5/weather", () =>
    HttpResponse.json({
      name: "Test City",
      main: { temp: 20, feels_like: 19, humidity: 50 },
      wind: { speed: 3 },
      weather: [{ description: "ясно", icon: "01d" }],
    }),
  ),
  http.get(REST, async ({ params, request }) => {
    const table = String(params.table);
    await capture(request, table);
    return HttpResponse.json(tableData[table] ?? []);
  }),
  http.post(REST, async ({ params, request }) => {
    const table = String(params.table);
    await capture(request, table);
    return HttpResponse.json(tableData[table] ?? [], { status: 201 });
  }),
  http.patch(REST, async ({ params, request }) => {
    const table = String(params.table);
    await capture(request, table);
    return HttpResponse.json(tableData[table] ?? []);
  }),
  http.delete(REST, async ({ params, request }) => {
    const table = String(params.table);
    await capture(request, table);
    return HttpResponse.json(tableData[table] ?? []);
  }),
];
