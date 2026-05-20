const ONDO_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/main/tokenlist.json";

export interface OndoToken {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

let cachedTokens: OndoToken[] | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getOndoTokens(): Promise<OndoToken[]> {
  const now = Date.now();

  if (cachedTokens && now - cacheTime < CACHE_TTL) {
    return cachedTokens;
  }

  try {
    const response = await fetch(ONDO_TOKEN_LIST_URL, { next: { revalidate: 3600 } });
    const data = await response.json();

    // Filter Ethereum mainnet tokens only
    cachedTokens = data.tokens.filter(
      (token: OndoToken) => token.chainId === 1 && token.logoURI
    );
    cacheTime = now;

    return cachedTokens || [];
  } catch (error) {
    console.error('Failed to fetch Ondo tokens:', error);
    return cachedTokens || [];
  }
}

export function getDisplayTokens(tokens: OndoToken[], limit: number = 4): OndoToken[] {
  // Prioritize popular tokens
  const priority = ['NVDAon', 'TSLAon', 'AMZNon', 'GOOGon', 'SPYon', 'QQQon', 'COINon'];

  const sorted = [...tokens].sort((a, b) => {
    const aIndex = priority.indexOf(a.symbol);
    const bIndex = priority.indexOf(b.symbol);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sorted.slice(0, limit);
}
