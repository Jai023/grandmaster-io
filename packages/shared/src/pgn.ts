export interface PgnMetadata {
  white: string;
  black: string;
  result: string;
  date: string;
  event?: string;
  site?: string;
  opening?: string;
  eco?: string;
}

export function parsePgnMetadata(pgn: string): PgnMetadata {
  const metadata: PgnMetadata = {
    white: 'Unknown',
    black: 'Unknown',
    result: '*',
    date: new Date().toISOString().split('T')[0],
  };

  const tagRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(pgn)) !== null) {
    const [, key, value] = match;
    switch (key.toLowerCase()) {
      case 'white':
        metadata.white = value;
        break;
      case 'black':
        metadata.black = value;
        break;
      case 'result':
        metadata.result = value;
        break;
      case 'date':
        metadata.date = value;
        break;
      case 'event':
        metadata.event = value;
        break;
      case 'site':
        metadata.site = value;
        break;
      case 'opening':
        metadata.opening = value;
        break;
      case 'eco':
        metadata.eco = value;
        break;
    }
  }

  return metadata;
}

export function extractMovesFromPgn(pgn: string): string[] {
  // Remove headers (lines starting with [)
  const moveText = pgn.replace(/\[.*?\]\s*/gs, '');
  
  // Remove comments in curly braces
  const noComments = moveText.replace(/\{[^}]*\}/g, '');
  
  // Remove move numbers and game termination markers
  const moveTokens = noComments
    .replace(/\d+\./g, '')
    .replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '')
    .split(/\s+/)
    .filter(token => token.length > 0 && !/^\d+$/.test(token));

  return moveTokens;
}

export function buildPgnString(
  moves: string[],
  metadata: Partial<PgnMetadata> = {}
): string {
  const tags = [
    `[Event "${metadata.event ?? 'Casual Game'}"]`,
    `[Site "${metadata.site ?? 'Grandmaster.io'}"]`,
    `[Date "${metadata.date ?? new Date().toISOString().split('T')[0]}"]`,
    `[White "${metadata.white ?? 'Unknown'}"]`,
    `[Black "${metadata.black ?? 'Unknown'}"]`,
    `[Result "${metadata.result ?? '*'}"]`,
  ];

  if (metadata.opening) {
    tags.push(`[Opening "${metadata.opening}"]`);
  }
  if (metadata.eco) {
    tags.push(`[ECO "${metadata.eco}"]`);
  }

  let moveText = '';
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) {
      moveText += `${Math.floor(i / 2) + 1}. `;
    }
    moveText += `${moves[i]} `;
  }

  const result = metadata.result ?? '*';
  return `${tags.join('\n')}\n\n${moveText.trim()} ${result}`.trim();
}
