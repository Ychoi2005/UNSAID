import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useBlocker,
} from "react-router-dom";
import { ArrowUpRight, LockKeyhole, Menu, X } from "lucide-react";
import { MotionConfig } from "motion/react";
import { VaultSession } from "../lib/storage/session";
import { VaultProvider, useVault } from "./VaultContext";
import Gate from "../features/vault/Gate";
import Welcome from "../components/Welcome";
import Editor from "../features/writing/Editor";
import Collection from "../features/archive/Collection";
const Constellation = lazy(
  () => import("../features/constellation/Constellation"),
);
import { Confirm } from "../components/ui";
const Perspective = lazy(() => import("../features/reflection/Perspective"));
const Settings = lazy(() => import("../features/vault/Settings"));
import Support from "../components/Support";
const navigation = [
  ["/", "The Quiet Room"],
  ["/letters", "Letters Never Sent"],
  ["/constellation", "Thought Constellation"],
  ["/timeline", "Reflection Timeline"],
  ["/perspectives", "Perspective Shift"],
  ["/archive", "The Archive"],
  ["/settings", "Privacy & Settings"],
];
export default function App() {
  const [session, setSession] = useState<VaultSession | null>(null);
  const locked = useCallback(() => setSession(null), []);
  if (!session) return <Gate onUnlock={setSession} />;
  return (
    <VaultProvider session={session} onLock={locked}>
      <Shell onCleared={locked} />
    </VaultProvider>
  );
}
function Shell({ onCleared }: { onCleared: () => void }) {
  const { motion, pending, error, unsaved, lock } = useVault();
  const [menu, setMenu] = useState(false);
  const [lockError, setLockError] = useState("");
  const [discardLock, setDiscardLock] = useState(false);
  const location = useLocation();
  const previous = useRef(location.pathname);
  useEffect(() => {
    if (previous.current !== location.pathname) {
      document.getElementById("main")?.focus();
      previous.current = location.pathname;
    }
    setMenu(false);
  }, [location.pathname]);
  const writing = location.pathname.startsWith("/write/");
  const blocker = useBlocker(writing && unsaved);
  return (
    <MotionConfig reducedMotion={motion ? "user" : "always"}>
      <div
        className={`app ${motion ? "" : "no-motion"} ${writing ? "is-writing" : ""}`}
      >
        <a href="#main" className="skip">
          Skip to content
        </a>
        <aside className="sidebar">
          <Link to="/" className="wordmark">
            UNSAID<span className="wordmark-dot">.</span>
          </Link>
          <span className="sidebar-subtitle">A PLACE FOR WHAT’S YOURS.</span>
          <button
            className="mobile-menu icon-button"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className={`sidebar-content ${menu ? "open" : ""}`}>
            <div className="nav-label">YOUR SPACE</div>
            <nav aria-label="Main navigation">
              {navigation.map(([path, label], i) => (
                <NavLink to={path} end key={path} aria-label={label}>
                  <span className="nav-index" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <span>{label}</span>
                  <span className="nav-active-mark" aria-hidden="true">
                    —
                  </span>
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button
                className="lock-button"
                disabled={!!pending}
                onClick={() => {
                  if (unsaved) {
                    setDiscardLock(true);
                    return;
                  }
                  void lock().catch((e) => setLockError(e.message));
                }}
              >
                <LockKeyhole size={15} />
                {pending ? "Saving…" : "Lock your space"}
                <ArrowUpRight size={13} />
              </button>
              <Link className="support-link" to="/support">
                A little support
              </Link>
              <span className="local-caption">LOCAL. ENCRYPTED. YOURS.</span>
              <p className="review-caption">
                Prototype · independent
                <br />
                security review still required.
              </p>
            </div>
          </div>
        </aside>
        <main
          id="main"
          tabIndex={-1}
          className={location.pathname === "/constellation" ? "night-main" : ""}
        >
          {(error || lockError) && (
            <div className="global-error" role="alert">
              {error || lockError}
              <span>
                {unsaved
                  ? "Keep this page open until your changes are saved."
                  : "Existing saved data has not been replaced."}
              </span>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route
              path="/write/:id"
              element={<Editor key={location.pathname} />}
            />
            <Route path="/letters" element={<Collection mode="letters" />} />
            <Route
              path="/constellation"
              element={
                <Suspense
                  fallback={
                    <section className="page" role="status">
                      Opening your sky…
                    </section>
                  }
                >
                  <Constellation />
                </Suspense>
              }
            />
            <Route path="/timeline" element={<Collection mode="timeline" />} />
            <Route
              path="/perspectives"
              element={
                <Suspense
                  fallback={
                    <section className="page" role="status">
                      Opening reflection…
                    </section>
                  }
                >
                  <Perspective />
                </Suspense>
              }
            />
            <Route path="/archive" element={<Collection mode="archive" />} />
            <Route
              path="/settings"
              element={
                <Suspense
                  fallback={
                    <section className="page" role="status">
                      Opening settings…
                    </section>
                  }
                >
                  <Settings onCleared={onCleared} />
                </Suspense>
              }
            />
            <Route path="/support" element={<Support />} />
            <Route
              path="/thoughts"
              element={<Navigate to="/archive" replace />}
            />
            <Route
              path="/write"
              element={
                <Navigate to={`/write/${crypto.randomUUID()}`} replace />
              }
            />
            <Route
              path="*"
              element={
                <section className="page">
                  <h1>A quiet wrong turn.</h1>
                  <Link className="text-button" to="/">
                    Return to your room
                    <ArrowUpRight size={16} />
                  </Link>
                </section>
              }
            />
          </Routes>
        </main>
        {blocker.state === "blocked" && (
          <Confirm
            title="Leave with unsaved changes?"
            description="A save failed. Your last changes may only exist on this screen. Copy them or cancel and try saving again before leaving."
            label="Leave & discard unsaved changes"
            onCancel={() => blocker.reset()}
            onConfirm={() => blocker.proceed()}
          />
        )}
        {discardLock && (
          <Confirm
            title="Lock with unsaved changes?"
            description="A save failed. Copy any unsaved writing first. Locking will discard unsaved changes still on screen; already saved writing remains in the vault."
            label="Discard unsaved changes & lock"
            onCancel={() => setDiscardLock(false)}
            onConfirm={() =>
              void lock(true).catch((e) => setLockError(e.message))
            }
          />
        )}
      </div>
    </MotionConfig>
  );
}
