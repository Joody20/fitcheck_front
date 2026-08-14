"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getNotifications, type NotificationItem } from "@/src/features/notifications/api/getNotifications";
import { useNotificationsStore } from "@/src/features/notifications/store/notificationsStore";

type Params = {
  enabled?: boolean;
  onNotifications?: (items: NotificationItem[]) => void;
  toastEnabled?: boolean;
  seenIdsLimit?: number;
  heartbeatTimeoutMs?: number;
  reconnectIntervalMs?: number;
  reconnectMaxIntervalMs?: number;
};

const TOAST_SEEN_STORAGE_KEY = "notifications:toast-seen-ids";

/** Local replacement for the old SSE subscription. It bootstraps mock
 * notifications once; no EventSource connection or retry loop is created. */
export function useNotificationStream({
  enabled = true,
  onNotifications,
  toastEnabled = true,
  seenIdsLimit = 200,
}: Params) {
  const router = useRouter();
  const prependItems = useNotificationsStore((state) => state.prependItems);
  const seenIdsRef = useRef(new Set<number>());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TOAST_SEEN_STORAGE_KEY);
      if (raw) seenIdsRef.current = new Set(JSON.parse(raw) as number[]);
    } catch { /* storage is optional */ }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void getNotifications({ size: 20 }).then(({ notifications = [] }) => {
      if (cancelled || notifications.length === 0) return;
      (onNotifications ?? prependItems)(notifications);
      if (!toastEnabled) return;
      notifications.forEach((item) => {
        if (!item.message || seenIdsRef.current.has(item.id)) return;
        seenIdsRef.current.add(item.id);
        while (seenIdsRef.current.size > seenIdsLimit) {
          const first = seenIdsRef.current.values().next().value;
          if (typeof first === "number") seenIdsRef.current.delete(first);
        }
        try { window.localStorage.setItem(TOAST_SEEN_STORAGE_KEY, JSON.stringify([...seenIdsRef.current])); } catch { /* ignore */ }
        toast(item.message, { position: "top-center", autoClose: 3000, onClick: () => router.push("/notifications") });
      });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [enabled, onNotifications, prependItems, router, seenIdsLimit, toastEnabled]);
}
