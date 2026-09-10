/**
 * The one seam these tests use: the global fetch.
 *
 * Tests render the real components through the real fetch client, query library
 * and component tree, and assert both on what renders and on the requests that
 * arrived here.
 */

export interface RecordedRequest {
  method: string;
  url: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

export interface StubbedResponse {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Holds the answer back, so a test can observe a loading state before it lands. */
  delayMs?: number;
}

export type Responder = StubbedResponse | ((request: RecordedRequest) => StubbedResponse | Promise<StubbedResponse>);

interface Route {
  method: string;
  path: string | RegExp;
  responder: Responder;
}

/** The origin jsdom serves the document from; relative request urls resolve against it. */
const PAGE_ORIGIN = 'http://localhost:3000';

/** The api origin the fetch client resolves to, via the stubbed `/config.json`. */
export const API_ORIGIN = 'http://localhost:8080';

const TEST_SITE_CONFIG = {
  local: {
    name: 'Local',
    url: API_ORIGIN,
    envs: [{ envKey: 'np', opaUrl: API_ORIGIN }],
  },
};

class HttpStub {
  public readonly requests: RecordedRequest[] = [];
  private routes: Route[] = [];

  /** Replaces the global fetch. Called by the setup file, before any page module loads. */
  public install(): void {
    this.reset();
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => this.handle(input, init)) as typeof fetch;
  }

  /** Drops every recorded request and every route, then reinstates the defaults. */
  public reset(): void {
    this.requests.length = 0;
    this.routes = [];
    this.on('GET', '/config.json', { body: TEST_SITE_CONFIG });
    this.on('GET', '/liveness', { body: { status: 'ok' } });
  }

  /** Registers a route. A later registration for the same path wins, so tests can override a default. */
  public on(method: string, path: string | RegExp, responder: Responder): void {
    this.routes.push({ method: method.toUpperCase(), path, responder });
  }

  public requestsFor(method: string, path: string): RecordedRequest[] {
    return this.requests.filter((request) => request.method === method.toUpperCase() && request.path === path);
  }

  public lastRequestFor(method: string, path: string): RecordedRequest | undefined {
    return this.requestsFor(method, path).at(-1);
  }

  private async handle(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = await this.record(input, init);

    for (let index = this.routes.length - 1; index >= 0; index--) {
      const route = this.routes[index]!;
      if (route.method !== request.method) continue;
      if (typeof route.path === 'string' ? route.path !== request.path : !route.path.test(request.path)) continue;

      const { status = 200, body, headers, delayMs } = typeof route.responder === 'function' ? await route.responder(request) : route.responder;
      if (delayMs !== undefined) await new Promise((resolve) => setTimeout(resolve, delayMs));
      return new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', ...headers },
      });
    }

    // Loud rather than a bare 404: an unstubbed call is a gap in the test, not a server answer.
    throw new TypeError(`No stub registered for ${request.method} ${request.path}`);
  }

  private async record(input: RequestInfo | URL, init?: RequestInit): Promise<RecordedRequest> {
    const isRequest = input instanceof Request;
    const url = new URL(isRequest ? input.url : input.toString(), PAGE_ORIGIN);
    const method = (isRequest ? input.method : (init?.method ?? 'GET')).toUpperCase();
    const rawBody = isRequest ? await input.clone().text() : typeof init?.body === 'string' ? init.body : undefined;

    const request: RecordedRequest = {
      method,
      url: url.toString(),
      path: url.pathname,
      query: url.searchParams,
      body: parseBody(rawBody),
    };
    this.requests.push(request);
    return request;
  }
}

const parseBody = (rawBody: string | undefined): unknown => {
  if (rawBody === undefined || rawBody === '') return undefined;
  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
};

export const http = new HttpStub();
