"use client";

import { useCallback } from "react";
import { localApiFetch } from "@/src/mocks/localApi";

export type LocalMessageFrame = { body: string };
export type LocalSubscription = { unsubscribe: () => void };

type UseChatSocketConnectionParams = {
  enabled?: boolean;
};

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export function useChatSocketConnection({
  enabled = true,
}: UseChatSocketConnectionParams) {
  const status: ConnectionStatus = enabled ? "connected" : "idle";

  const subscribe = useCallback(
    (
      destination: string,
      callback: (message: LocalMessageFrame) => void,
      headers?: Record<string, string>,
    ): LocalSubscription | null => {
      void destination;
      void callback;
      void headers;
      return { unsubscribe: () => undefined };
    },
    [],
  );

  const publish = useCallback(
    ({
      destination,
      body,
      headers,
    }: {
      destination: string;
      body?: string;
      headers?: Record<string, string>;
    }) => {
      void headers;
      if (destination === "/app/chat.message" && body) {
        const payload = JSON.parse(body) as { roomId: string; message?: string; imageObjectKey?: string | null };
        void localApiFetch(`/api/chat/rooms/${payload.roomId}/messages`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    },
    [],
  );

  return { status, subscribe, publish };
}
