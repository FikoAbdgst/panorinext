"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Proteksi sesi tunggal ala booth Laravel: satu order berbayar hanya boleh
 * dipakai di satu tab/perangkat pada saat bersamaan. Status disimpan di
 * `localStorage` + heartbeat, sehingga tidak butuh perubahan backend.
 */

const STORAGE_PREFIX = "activeBoothSession";
const HEARTBEAT_INTERVAL = 2000;
const SESSION_TIMEOUT = 10000;

type SessionData = {
  sessionId: string;
  orderId: string;
  frameId: number;
  startTime: number;
  lastHeartbeat: number;
  userAgent: string;
};

function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function readSession(key: string): SessionData | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SessionData) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, data: SessionData): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* localStorage bisa penuh / diblokir; proteksi sesi cukup dilewati */
  }
}

export function useSingleSession({
  enabled,
  orderId,
  frameId,
  onTakeover,
}: {
  enabled: boolean;
  orderId: string | null;
  frameId: number;
  onTakeover?: () => void;
}) {
  const key = enabled && orderId ? `${STORAGE_PREFIX}_${orderId}_${frameId}` : null;
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const onTakeoverRef = useRef(onTakeover);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    onTakeoverRef.current = onTakeover;
  }, [onTakeover]);

  useEffect(() => {
    if (!key) {
      return;
    }
    const storageKey = key;

    const stopHeartbeat = () => {
      if (heartbeatRef.current !== null) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    const startHeartbeat = (sessionId: string) => {
      stopHeartbeat();
      heartbeatRef.current = window.setInterval(() => {
        const stored = readSession(storageKey);
        if (!stored || stored.sessionId !== sessionId) {
          stopHeartbeat();
          onTakeoverRef.current?.();
          return;
        }
        writeSession(storageKey, { ...stored, lastHeartbeat: Date.now() });
      }, HEARTBEAT_INTERVAL);
    };

    const createSession = () => {
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;
      writeSession(storageKey, {
        sessionId,
        orderId: orderId ?? "",
        frameId,
        startTime: Date.now(),
        lastHeartbeat: Date.now(),
        userAgent: navigator.userAgent.slice(0, 100),
      });
      startHeartbeat(sessionId);
    };

    const init = () => {
      const stored = readSession(storageKey);
      if (stored) {
        if (Date.now() - stored.lastHeartbeat > SESSION_TIMEOUT) {
          window.localStorage.removeItem(storageKey);
        } else {
          setBlocked(true);
          return;
        }
      }
      createSession();
    };

    const startTimer = window.setTimeout(init, 0);

    return () => {
      window.clearTimeout(startTimer);
      const stored = readSession(storageKey);
      if (stored && stored.sessionId === sessionIdRef.current) {
        window.localStorage.removeItem(storageKey);
      }
      stopHeartbeat();
    };
  }, [key, orderId, frameId]);

  const forceNewSession = useCallback(() => {
    if (!key) {
      return;
    }
    window.localStorage.removeItem(key);
    setBlocked(false);
    const sessionId = generateSessionId();
    sessionIdRef.current = sessionId;
    writeSession(key, {
      sessionId,
      orderId: orderId ?? "",
      frameId,
      startTime: Date.now(),
      lastHeartbeat: Date.now(),
      userAgent: navigator.userAgent.slice(0, 100),
    });
    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = window.setInterval(() => {
      const stored = readSession(key);
      if (!stored || stored.sessionId !== sessionId) {
        if (heartbeatRef.current !== null) {
          window.clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        onTakeoverRef.current?.();
        return;
      }
      writeSession(key, { ...stored, lastHeartbeat: Date.now() });
    }, HEARTBEAT_INTERVAL);
  }, [key, orderId, frameId]);

  return { blocked, forceNewSession };
}
