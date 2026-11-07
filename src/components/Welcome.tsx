import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useVault } from "../app/VaultContext";
export default function Welcome() {
  const navigate = useNavigate();
  const { data, motion: animations } = useVault();
  const reduced = useReducedMotion();
  const draft = data.drafts
    .filter((d) => d.kind === "thought")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return (
    <section className="quiet-room">
      <div className="room-kicker">
        <span className="room-line" />
        THE QUIET ROOM<span>01 / 07</span>
      </div>
      <motion.div
        className="room-composition"
        initial={animations && !reduced ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animations && !reduced ? 0.45 : 0 }}
      >
        <span className="editorial-note">A page. A pause. A little room.</span>
        <h1>
          Some thoughts are easier
          <br />
          to <em>write</em> than to say.
        </h1>
        <p>You don’t have to explain yourself here.</p>
        <button
          className="button"
          onClick={() => navigate(`/write/${draft?.id ?? crypto.randomUUID()}`)}
        >
          Begin writing
          <ArrowRight size={17} />
        </button>
        {draft && (
          <span className="resume-note">
            Your unfinished draft is here when you’re ready.
          </span>
        )}
        <div className="room-art" aria-hidden="true">
          <div className="room-window">
            <span className="window-moon" />
            <i />
            <i />
            <i />
            <i />
            <div className="window-cross" />
          </div>
          <span className="room-art-caption">SOMEWHERE TO SIMPLY EXIST.</span>
        </div>
      </motion.div>
      <footer className="room-footer">
        <span>Not every feeling needs an explanation.</span>
        <button onClick={() => navigate("/archive")} className="text-button">
          The things you’ve kept
          <ArrowUpRight size={15} />
        </button>
      </footer>
    </section>
  );
}
