/**
 * Line-buffered NDJSON parser for streaming Docker exec output.
 *
 * Docker may deliver partial lines across chunk boundaries, so we buffer
 * incomplete lines and only emit fully-formed JSON objects.
 */
export class NdjsonParser {
  private buffer = '';

  /**
   * Feed a raw chunk from the stream and get back any complete JSON objects.
   */
  parse(chunk: string): any[] {
    this.buffer += chunk;
    const results: any[] = [];
    const lines = this.buffer.split('\n');

    // Keep the last (potentially incomplete) line in the buffer
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        results.push(JSON.parse(trimmed));
      } catch {
        // Skip malformed lines (e.g. stderr leaking into stdout)
      }
    }

    return results;
  }

  /**
   * Flush any remaining content in the buffer (call when stream ends).
   */
  flush(): any[] {
    const trimmed = this.buffer.trim();
    this.buffer = '';
    if (!trimmed) return [];

    try {
      return [JSON.parse(trimmed)];
    } catch {
      return [];
    }
  }
}
