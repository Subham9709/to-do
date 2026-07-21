import jwt from 'jsonwebtoken';

let cachedCerts: { [key: string]: string } = {};
let certsExpiryTime = 0;

const fetchCerts = async () => {
  const now = Date.now();
  if (Object.keys(cachedCerts).length > 0 && now < certsExpiryTime) {
    return cachedCerts;
  }

  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    const data = await res.json() as { [key: string]: string };
    
    cachedCerts = data;
    certsExpiryTime = now + 6 * 60 * 60 * 1000; // Cache for 6 hours
    return cachedCerts;
  } catch (error) {
    console.error('Failed to fetch Firebase public certs', error);
    throw new Error('Failed to verify token (network error)');
  }
};

export const verifyFirebaseToken = async (token: string, firebaseProjectId: string) => {
  try {
    const certs = await fetchCerts();
    const decodedHeader = jwt.decode(token, { complete: true });
    
    if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header.kid) {
      throw new Error('Invalid token structure');
    }

    const kid = decodedHeader.header.kid;
    const cert = certs[kid];
    if (!cert) {
      throw new Error('Public key not found for token signature');
    }

    // Verify token details
    const payload = jwt.verify(token, cert, {
      audience: firebaseProjectId,
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      algorithms: ['RS256'],
    }) as {
      name?: string;
      email?: string;
      picture?: string;
      email_verified?: boolean;
      sub: string; // Firebase User ID
    };

    return payload;
  } catch (error: any) {
    console.error('Firebase token verification failed:', error.message);
    throw new Error(`Token verification failed: ${error.message}`);
  }
};
