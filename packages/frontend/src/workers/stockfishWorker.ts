import type { AnalysisResult } from '@grandmaster-io/shared';

let worker: Worker | null = null;
let pendingResolve: ((result: AnalysisResult) => void) | null = null;
let pendingReject: ((err: Error) => void) | null = null;
let currentFen = '';
let analysisTimeout: ReturnType<typeof setTimeout> | null = null;

function getWorker(): Worker {
  if (!worker) {
    try {
      worker = new Worker('/stockfish.js');
    } catch (err) {
      throw new Error(
        'Failed to initialize Stockfish chess engine. ' +
        'Ensure stockfish.js is present in the public directory. ' +
        `Details: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    worker.onmessage = handleMessage;
    worker.onerror = (e) => {
      if (pendingReject) {
        pendingReject(new Error(`Stockfish worker error: ${e.message}`));
        pendingResolve = null;
        pendingReject = null;
      }
    };
    worker.postMessage('uci');
  }
  return worker;
}

let latestEval = 0;
let latestDepth = 0;
let latestPv: string[] = [];
let latestBestMove = 'e2e4';

function handleMessage(e: MessageEvent<string>) {
  const line: string = e.data;

  if (line.startsWith('info') && line.includes('score cp')) {
    const cpMatch = line.match(/score cp (-?\d+)/);
    const depthMatch = line.match(/depth (\d+)/);
    const pvMatch = line.match(/ pv (.+)$/);

    if (cpMatch) latestEval = parseInt(cpMatch[1]);
    if (depthMatch) latestDepth = parseInt(depthMatch[1]);
    if (pvMatch) latestPv = pvMatch[1].trim().split(/\s+/);
  }

  if (line.startsWith('bestmove')) {
    const parts = line.split(/\s+/);
    latestBestMove = parts[1] || 'e2e4';

    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
      analysisTimeout = null;
    }

    if (pendingResolve) {
      pendingResolve({
        fen: currentFen,
        bestMove: latestBestMove,
        evaluation: latestEval,
        depth: latestDepth,
        pv: latestPv,
      });
      pendingResolve = null;
      pendingReject = null;
    }
  }
}

export function analyzePosition(fen: string, depth = 15): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    // Cancel any pending analysis
    if (pendingResolve) {
      const w = getWorker();
      w.postMessage('stop');
      pendingResolve = null;
      pendingReject = null;
    }

    currentFen = fen;
    latestEval = 0;
    latestDepth = 0;
    latestPv = [];
    latestBestMove = 'e2e4';

    pendingResolve = resolve;
    pendingReject = reject;

    const w = getWorker();
    w.postMessage('isready');
    w.postMessage(`position fen ${fen}`);
    w.postMessage(`go depth ${depth}`);

    // Timeout fallback
    analysisTimeout = setTimeout(() => {
      if (pendingResolve) {
        pendingResolve({
          fen,
          bestMove: latestBestMove || 'e2e4',
          evaluation: latestEval,
          depth: latestDepth || 1,
          pv: latestPv,
        });
        pendingResolve = null;
        pendingReject = null;
      }
    }, 10000);
  });
}

export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
