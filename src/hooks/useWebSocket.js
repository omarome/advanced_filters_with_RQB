import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '../context/AuthProvider';

const WS_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace('/api', '') + '/ws';

/**
 * Subscribes to a STOMP topic over WebSocket (SockJS fallback).
 *
 * The hook connects once per `topic` and calls `onMessage` whenever
 * a frame arrives. It reconnects automatically after disconnect.
 *
 * @param {string}   topic       STOMP destination, e.g. '/topic/opportunities'
 * @param {function} onMessage   Called with the parsed JSON payload
 * @param {boolean}  enabled     Set to false to skip connecting
 */
export function useWebSocket(topic, onMessage, enabled = true) {
  const clientRef    = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep the callback ref fresh without re-connecting
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !topic) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(topic, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            onMessageRef.current(payload);
          } catch {
            onMessageRef.current(frame.body);
          }
        });
      },
      onStompError: (frame) => {
        console.warn('[WS] STOMP error:', frame.headers?.message);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [topic, enabled]);
}
