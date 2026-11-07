import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { VaultData } from "../types/vault";
import { VaultSession } from "../lib/storage/session";
interface VaultContextValue {
  data: VaultData;
  pending: number;
  unsaved: boolean;
  error: string;
  mutate: (change: (data: VaultData) => void) => Promise<void>;
  run: <T>(action: (session: VaultSession) => Promise<T>) => Promise<T>;
  lock: (discard?: boolean) => Promise<void>;
  motion: boolean;
  setMotion: (value: boolean) => void;
  idle: number;
  setIdle: (value: number) => void;
}
const Context = createContext<VaultContextValue | null>(null);
export function useVault() {
  const value = useContext(Context);
  if (!value) throw new Error("An unlocked vault is required.");
  return value;
}
function preference(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function VaultProvider({
  session,
  onLock,
  children,
}: {
  session: VaultSession;
  onLock: () => void;
  children: ReactNode;
}) {
  const [data, setData] = useState(session.data);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");
  const [motion, setMotionState] = useState(
    () => preference("unsaid-motion", "on") !== "off",
  );
  const [idle, setIdleState] = useState(() =>
    Number(preference("unsaid-idle", "15")),
  );
  const locking = useRef(false);
  const [isLocking, setIsLocking] = useState(false);
  const run = useCallback(
    async <T,>(action: (session: VaultSession) => Promise<T>) => {
      setPending((p) => p + 1);
      try {
        const result = await action(session);
        setData(session.data);
        setError(
          session.unsaved
            ? "A writing change is not saved. Return to the editor and try saving again, or explicitly discard it before locking."
            : "",
        );
        return result;
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "The change could not be saved. Keep this page open and try again.";
        setError(message);
        throw e;
      } finally {
        setPending((p) => p - 1);
      }
    },
    [session],
  );
  const mutate = useCallback(
    async (change: (data: VaultData) => void) => {
      await run((s) => s.mutate(change));
    },
    [run],
  );
  const lock = useCallback(
    async (discard = false) => {
      if (locking.current) return;
      if (session.unsaved && !discard)
        throw new Error(
          "A change has not been saved. Resolve the save error before locking.",
        );
      locking.current = true;
      setIsLocking(true);
      try {
        await session.lock(discard);
        onLock();
      } finally {
        locking.current = false;
        setIsLocking(false);
      }
    },
    [session, onLock],
  );
  const unsaved = session.unsaved;
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (pending || unsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [pending, unsaved]);
  useEffect(() => {
    if (!idle) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void lock().catch(() => {});
      }, idle * 60000);
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [idle, lock]);
  const setPreference = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Settings apply for this session when preference storage is blocked. */
    }
  };
  return (
    <Context.Provider
      value={{
        data,
        pending,
        unsaved,
        error,
        mutate,
        run,
        lock,
        motion,
        setMotion: (value) => {
          setMotionState(value);
          setPreference("unsaid-motion", value ? "on" : "off");
        },
        idle,
        setIdle: (value) => {
          setIdleState(value);
          setPreference("unsaid-idle", String(value));
        },
      }}
    >
      <div className="context-root" inert={isLocking}>
        {children}
      </div>
      {isLocking && (
        <div className="locking-screen" role="status">
          Saving and locking your vault…
        </div>
      )}
    </Context.Provider>
  );
}
