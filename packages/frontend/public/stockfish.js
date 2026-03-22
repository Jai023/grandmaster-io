// Stockfish UCI stub - simulates engine responses for Grandmaster.io
// This runs as a Web Worker and simulates the UCI protocol

const BEST_MOVES = [
  'e2e4', 'd2d4', 'g1f3', 'c2c4', 'e7e5', 'd7d5', 'g8f6', 'c7c5',
  'b1c3', 'f1c4', 'f1b5', 'c1f4', 'd1d4', 'e1g1', 'e8g8',
  'a2a3', 'h2h3', 'b2b4', 'f2f4', 'g2g3',
];

function getRandomMove() {
  return BEST_MOVES[Math.floor(Math.random() * BEST_MOVES.length)];
}

function getSimulatedEval() {
  // Return centipawn value between -300 and 300
  return Math.floor((Math.random() - 0.5) * 600);
}

function buildInfoLine(depth, eval_, pv) {
  return `info depth ${depth} seldepth ${depth + 2} multipv 1 score cp ${eval_} nodes ${depth * 12500} nps 800000 time ${depth * 15} pv ${pv.join(' ')}`;
}

self.onmessage = function (e) {
  const cmd = (typeof e.data === 'string' ? e.data : '').trim();

  if (cmd === 'uci') {
    self.postMessage('id name Stockfish 16 (stub)');
    self.postMessage('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott');
    self.postMessage('option name Threads type spin default 1 min 1 max 512');
    self.postMessage('option name Hash type spin default 16 min 1 max 33554432');
    self.postMessage('uciok');
    return;
  }

  if (cmd === 'isready') {
    self.postMessage('readyok');
    return;
  }

  if (cmd === 'ucinewgame') {
    return;
  }

  if (cmd.startsWith('setoption')) {
    return;
  }

  if (cmd.startsWith('position')) {
    return;
  }

  if (cmd.startsWith('go')) {
    // Parse depth or movetime
    const depthMatch = cmd.match(/depth (\d+)/);
    const movetimeMatch = cmd.match(/movetime (\d+)/);
    const depth = depthMatch ? parseInt(depthMatch[1]) : (movetimeMatch ? Math.min(Math.floor(parseInt(movetimeMatch[1]) / 100), 20) : 15);

    const actualDepth = Math.min(depth, 25);
    const evalScore = getSimulatedEval();
    const bestMove = getRandomMove();

    // Simulate progressive depth analysis
    const delays = [];
    for (let d = 1; d <= actualDepth; d++) {
      delays.push(d);
    }

    let i = 0;
    const sendNext = () => {
      if (i >= delays.length) {
        self.postMessage(`bestmove ${bestMove}`);
        return;
      }
      const d = delays[i++];
      const pv = [bestMove, getRandomMove(), getRandomMove()];
      self.postMessage(buildInfoLine(d, evalScore + Math.floor((Math.random() - 0.5) * 20), pv));
      if (i < delays.length) {
        setTimeout(sendNext, 8);
      } else {
        setTimeout(() => {
          self.postMessage(`bestmove ${bestMove}`);
        }, 8);
      }
    };

    sendNext();
    return;
  }

  if (cmd === 'stop') {
    const bestMove = getRandomMove();
    self.postMessage(`bestmove ${bestMove}`);
    return;
  }

  if (cmd === 'quit') {
    self.close();
  }
};
