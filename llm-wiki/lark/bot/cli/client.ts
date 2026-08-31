export type FetchLike = typeof fetch;

export class BotHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  health(): Promise<unknown> {
    return this.request('/health');
  }

  send(input: { receiveId: string; receiveIdType: string; text: string }): Promise<unknown> {
    return this.request('/messages', { method: 'POST', body: JSON.stringify(input) });
  }

  events(limit: number): Promise<unknown> {
    return this.request(`/events?limit=${limit}`);
  }

  cardActions(requestId: string): Promise<unknown> {
    return this.request(`/card-actions?requestId=${encodeURIComponent(requestId)}`);
  }

  process(eventId: string): Promise<unknown> {
    return this.request(`/events/${encodeURIComponent(eventId)}/process`, { method: 'POST' });
  }

  sendCard(receiveId: string, receiveIdType: string): Promise<unknown> {
    return this.request('/cards/test', {
      method: 'POST',
      body: JSON.stringify({ receiveId, receiveIdType }),
    });
  }

  sendBookingCard(input: {
    receiveId: string; receiveIdType: string; requestId: string; className: string;
    gymName: string; startTime: string; endTime: string; onlineCost: number;
  }): Promise<unknown> {
    return this.request('/cards/booking', { method: 'POST', body: JSON.stringify(input) });
  }

  sendCourseListCard(input: {
    receiveId: string; receiveIdType: string; requestId: string; date: string;
    gymName: string; courses: unknown[];
  }): Promise<unknown> {
    return this.request('/cards/course-list', { method: 'POST', body: JSON.stringify(input) });
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', ...init.headers },
      });
    } catch (error) {
      throw new Error(`无法连接 Bot 服务: ${error instanceof Error ? error.message : String(error)}`);
    }

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: text.slice(0, 300) };
      }
    }
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${response.status}`;
      throw new Error(message);
    }
    return body;
  }
}
