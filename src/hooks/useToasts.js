import { useCallback, useRef, useState } from "react";

/** Simple notification queue. notify({ type: "success" | "error" | "info", title, message }). */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    ({ type = "info", title, message, duration = 6000 }) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, type, title, message }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return { toasts, notify, dismiss };
}
