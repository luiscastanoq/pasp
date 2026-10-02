import { isIP } from 'node:net';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env';

export const shouldSkipLoginRateLimit = (): boolean => env.NODE_ENV === 'test';

export const normalizeClientIp = (value: string | undefined): string => {
  const ip = value?.trim() || 'unknown';

  if (isIP(ip)) {
    return ip;
  }

  const bracketedIpv6 = /^\[([^\]]+)\](?::\d+)?$/.exec(ip)?.[1];
  if (bracketedIpv6 && isIP(bracketedIpv6) === 6) {
    return bracketedIpv6;
  }

  const ipv4WithPort = /^(.+):\d+$/.exec(ip)?.[1];
  if (ipv4WithPort && isIP(ipv4WithPort) === 4) {
    return ipv4WithPort;
  }

  return ip;
};

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: request => ipKeyGenerator(normalizeClientIp(request.ip)),
  // Los E2E repiten logins conocidos; producción mantiene el límite completo.
  skip: shouldSkipLoginRateLimit,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Demasiados intentos de login. Inténtalo de nuevo más tarde',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: request => ipKeyGenerator(normalizeClientIp(request.ip)),
  skip: shouldSkipLoginRateLimit,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Demasiadas peticiones. Inténtalo de nuevo más tarde',
  },
});
