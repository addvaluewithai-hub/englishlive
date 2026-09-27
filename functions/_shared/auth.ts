export interface AuthEnv {
  NEON_AUTH_JWKS_URL?: string;
}

interface JwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
}

interface JwksResponse {
  keys?: JsonWebKey[];
}

const DEFAULT_JWKS_URL = 'https://ep-lucky-sound-b4k7l37j.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json';
const encoder = new TextEncoder();
let cachedJwks: { url: string; expiresAt: number; keys: JsonWebKey[] } | null = null;

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

async function loadJwks(url: string, force = false) {
  if (!force && cachedJwks?.url === url && cachedJwks.expiresAt > Date.now()) return cachedJwks.keys;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Unable to load Neon Auth JWKS (${response.status}).`);
  const payload = await response.json() as JwksResponse;
  const keys = Array.isArray(payload.keys) ? payload.keys : [];
  if (!keys.length) throw new Error('Neon Auth JWKS did not contain verification keys.');
  cachedJwks = { url, keys, expiresAt: Date.now() + 5 * 60_000 };
  return keys;
}

function keyAlgorithm(header: JwtHeader, jwk: JsonWebKey) {
  const alg = header.alg || jwk.alg;
  switch (alg) {
    case 'EdDSA':
      return {
        importAlgorithm: { name: 'Ed25519' } as AlgorithmIdentifier,
        verifyAlgorithm: { name: 'Ed25519' } as AlgorithmIdentifier,
      };
    case 'RS256':
      return {
        importAlgorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } as RsaHashedImportParams,
        verifyAlgorithm: { name: 'RSASSA-PKCS1-v1_5' } as AlgorithmIdentifier,
      };
    case 'PS256':
      return {
        importAlgorithm: { name: 'RSA-PSS', hash: 'SHA-256' } as RsaHashedImportParams,
        verifyAlgorithm: { name: 'RSA-PSS', saltLength: 32 } as RsaPssParams,
      };
    case 'ES256':
      return {
        importAlgorithm: { name: 'ECDSA', namedCurve: 'P-256' } as EcKeyImportParams,
        verifyAlgorithm: { name: 'ECDSA', hash: 'SHA-256' } as EcdsaParams,
      };
    case 'ES512':
      return {
        importAlgorithm: { name: 'ECDSA', namedCurve: 'P-521' } as EcKeyImportParams,
        verifyAlgorithm: { name: 'ECDSA', hash: 'SHA-512' } as EcdsaParams,
      };
    default:
      throw new Error(`Unsupported Neon Auth JWT algorithm: ${alg ?? 'unknown'}.`);
  }
}

async function verifyWithKey(token: string, headerPart: string, payloadPart: string, signaturePart: string, header: JwtHeader, jwk: JsonWebKey) {
  const algorithms = keyAlgorithm(header, jwk);
  const key = await crypto.subtle.importKey('jwk', jwk, algorithms.importAlgorithm, false, ['verify']);
  return crypto.subtle.verify(
    algorithms.verifyAlgorithm,
    key,
    decodeBase64Url(signaturePart),
    encoder.encode(`${headerPart}.${payloadPart}`),
  );
}

export async function authenticateRequest(request: Request, env: AuthEnv) {
  const authorization = request.headers.get('authorization')?.trim() ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return null;
  const token = authorization.slice(7).trim();
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) return null;

  let header: JwtHeader;
  let claims: JwtClaims;
  try {
    header = decodeJson<JwtHeader>(headerPart);
    claims = decodeJson<JwtClaims>(payloadPart);
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!claims.sub || typeof claims.sub !== 'string') return null;
  if (typeof claims.exp === 'number' && claims.exp <= now - 15) return null;
  if (typeof claims.nbf === 'number' && claims.nbf > now + 15) return null;

  const jwksUrl = env.NEON_AUTH_JWKS_URL?.trim() || DEFAULT_JWKS_URL;
  let keys = await loadJwks(jwksUrl);
  let candidates = header.kid ? keys.filter((key) => key.kid === header.kid) : keys;
  if (!candidates.length) {
    keys = await loadJwks(jwksUrl, true);
    candidates = header.kid ? keys.filter((key) => key.kid === header.kid) : keys;
  }

  for (const jwk of candidates) {
    try {
      if (await verifyWithKey(token, headerPart, payloadPart, signaturePart, header, jwk)) {
        return {
          userId: claims.sub,
          email: typeof claims.email === 'string' ? claims.email : null,
          name: typeof claims.name === 'string' ? claims.name : null,
          claims,
        };
      }
    } catch (error) {
      console.warn('[auth] JWT verification candidate failed', error instanceof Error ? error.message : String(error));
    }
  }

  return null;
}
