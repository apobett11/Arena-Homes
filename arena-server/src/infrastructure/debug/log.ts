import fs from 'fs';
import path from 'path';

type DebugPayload = {
    sessionId: string;
    runId: string;
    hypothesisId: string;
    location: string;
    message: string;
    data?: Record<string, unknown>;
    timestamp: number;
};

/**
 * Debug-mode NDJSON logger.
 * Writes to a repo-visible file so we can inspect runtime evidence in this environment.
 * IMPORTANT: Do not log secrets (tokens/passwords/PII).
 */
export function debugLog(payload: DebugPayload) {
    try {
        const file = path.join(process.cwd(), 'debug_runtime.ndjson');
        fs.appendFileSync(file, JSON.stringify(payload) + '\n', { encoding: 'utf8' });
    } catch {
        // best-effort only
    }
}

