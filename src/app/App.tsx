import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  Mail,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Stars,
} from "lucide-react";
import { MotionConfig } from "motion/react";
import Welcome from "../components/Welcome";
import { PageHeader, PrivacyBanner } from "../components/common";
import Editor from "../features/writing/Editor";
import Thoughts from "../features/writing/Thoughts";

const nav = [
  { to: "/", label: "The Quiet Room", icon: Moon },
  { to: "/thoughts", label: "My thoughts", icon: BookOpen },
];
const future = [
  { to: "/letters", label: "Letters Never Sent", icon: Mail },
  { to: "/constellation", label: "Thought Constellation", icon: Stars },
  { to: "/perspectives", label: "Perspective Shift", icon: Sparkles },
];
function App() {
  const [animations, setAnimations] = useState(() => {
    try {
      return localStorage.getItem("unsaid-motion") !== "off";
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      document.querySelector<HTMLElement>("main")?.focus();
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);
  return (
    <MotionConfig reducedMotion={animations ? "user" : "always"}>
      <div className={animations ? "app" : "app no-motion"}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <aside className="sidebar">
          <Link className="brand" to="/">
            UNSAID<span>A LITTLE ROOM FOR YOU</span>
          </Link>
          <div className="mobile-utilities">
            <Link to="/settings" aria-label="Your space, your way">
              <Settings size={18} />
            </Link>
            <Link to="/support" aria-label="A little support">
              <HelpCircle size={18} />
            </Link>
          </div>
          <div className="nav-caption">YOUR SPACE</div>
          <nav aria-label="Main navigation">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <div className="nav-divider" />
            {future.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}>
                <Icon size={18} />
                {label}
                <span className="soon-dot" title="Coming in a later phase" />
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="privacy-note">
              <Shield size={17} />
              <div>
                Only on this browser<span>Early prototype · not encrypted</span>
              </div>
            </div>
            <NavLink to="/settings">
              <Settings size={17} />
              Your space, your way
            </NavLink>
            <NavLink to="/support">
              <HelpCircle size={17} />A little support
            </NavLink>
          </div>
          <div className="sidebar-quote">
            Some things just need
            <br />
            somewhere to exist.<span>✧</span>
          </div>
        </aside>
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Welcome animations={animations} />} />
            <Route path="/write" element={<Editor />} />
            <Route path="/thoughts" element={<Thoughts />} />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  animations={animations}
                  onChange={(value) => {
                    setAnimations(value);
                    try {
                      localStorage.setItem(
                        "unsaid-motion",
                        value ? "on" : "off",
                      );
                    } catch {
                      /* Preference remains active for this visit when storage is unavailable. */
                    }
                  }}
                />
              }
            />
            <Route path="/support" element={<Support />} />
            {future.map((item) => (
              <Route
                key={item.to}
                path={item.to}
                element={<ComingSoon path={item.to} />}
              />
            ))}
            <Route
              path="*"
              element={
                <section className="page">
                  <h1>A quiet wrong turn.</h1>
                  <Link className="button" to="/">
                    Return to your room
                  </Link>
                </section>
              }
            />
          </Routes>
        </main>
      </div>
    </MotionConfig>
  );
}
function SettingsPage({
  animations,
  onChange,
}: {
  animations: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <section className="page prose">
      <PageHeader
        eyebrow="ON YOUR TERMS"
        title="Your space, your way."
        description="A few small things to make this place yours."
      />
      <div className="setting-row">
        <div>
          <h2>Decorative motion</h2>
          <p>
            Gentle stars and soft transitions. Your device’s reduced-motion
            preference is always respected.
          </p>
        </div>
        <input
          aria-label="Decorative motion"
          type="checkbox"
          checked={animations}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
      <h2>Where your words live</h2>
      <p>
        Thoughts and drafts stay in IndexedDB on this browser and device. There
        are no accounts, analytics, external fonts, AI services, or cloud
        backups.
      </p>
      <PrivacyBanner />
      <h2>What’s still to come</h2>
      <p>
        Passphrase protection, encryption, data export and import, and clearing
        all data are planned for Phase 3. This version is for non-sensitive
        prototype use. Individual thoughts can be deleted from My thoughts;
        unfinished drafts can be discarded in the editor.
      </p>
      <p>
        Other people with access to this browser profile, extensions, or
        compromised software may be able to read your writing. Browser storage
        can be cleared or evicted. Deletion is not a guarantee of forensic
        erasure.
      </p>
    </section>
  );
}
function Support() {
  return (
    <section className="page prose">
      <PageHeader
        eyebrow="A LITTLE SUPPORT"
        title="You don’t have to carry it alone."
        description="UNSAID is a writing space, not therapy or an emergency service."
      />
      <p>
        You can pause or leave whenever you want. Nothing here diagnoses,
        monitors, or analyses your writing.
      </p>
      <h2>If you need immediate help</h2>
      <p>
        If you or someone else is in immediate danger, contact your local
        emergency services.
      </p>
      <p>
        In Australia, call Lifeline on <a href="tel:131114">13 11 14</a> or
        visit{" "}
        <a href="https://www.lifeline.org.au/" target="_blank" rel="noreferrer">
          Lifeline
        </a>
        . In the US or Canada, call or text <a href="tel:988">988</a>. For other
        countries, visit{" "}
        <a href="https://findahelpline.com/" target="_blank" rel="noreferrer">
          Find a Helpline
        </a>
        .
      </p>
      <p>
        External support websites have their own privacy policies. They receive
        no writing from UNSAID.
      </p>
      <Link className="button" to="/">
        Return to your room
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
function ComingSoon({ path }: { path: string }) {
  const item = future.find((i) => i.to === path)!;
  return (
    <section className="page coming-page">
      <item.icon size={40} />
      <div className="eyebrow">A LITTLE FURTHER DOWN THE PATH</div>
      <h1>{item.label}</h1>
      <p>
        {path === "/letters"
          ? "Some words are meant to be written, not delivered."
          : path === "/constellation"
            ? "Every thought has its place in your universe."
            : "Sometimes, another question opens another door."}
      </p>
      <div className="future-note">
        This space is still taking shape. It is not available in this foundation
        version.
      </div>
      <Link className="button" to="/write">
        For now, let it out
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
export default App;
