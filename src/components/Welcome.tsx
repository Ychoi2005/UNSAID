import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Feather,
  Heart,
  Mail,
  Shield,
  Sparkles,
  Stars,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
export default function Welcome({ animations }: { animations: boolean }) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animations && !reducedMotion;
  return (
    <>
      <header className="topbar">
        <span>
          <span className="tiny-star">✧</span> YOUR OWN LITTLE CORNER OF THE
          WORLD
        </span>
        <Link to="/settings">
          <Shield size={14} /> Local to this browser
        </Link>
      </header>
      <section className="welcome">
        <div className="sky" aria-hidden="true">
          {Array.from({ length: 37 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 73 + 13) % 100}%`,
                top: `${(i * 47 + 9) % 90}%`,
                animationDelay: `${i % 7}s`,
              }}
            />
          ))}
          <svg className="constellation-art" viewBox="0 0 240 140">
            <path d="M25 110 70 52 125 72 172 22 216 53 M125 72 157 117" />
            {[
              [25, 110],
              [70, 52],
              [125, 72],
              [172, 22],
              [216, 53],
              [157, 117],
            ].map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="2.5" />
            ))}
          </svg>
          <div className="moon" />
        </div>
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldAnimate ? 0.8 : 0 }}
          className="welcome-copy"
        >
          <div className="eyebrow">TAKE A BREATH. YOU’RE HERE.</div>
          <h1>
            Some thoughts are easier
            <br />
            to <em>write</em> than to say.
          </h1>
          <p>You don’t have to explain yourself here.</p>
          <p className="intro">
            The unfinished thoughts. The words you held back.
            <br />
            Whatever you’re carrying, there’s room for it here.
          </p>
          <Link className="button primary" to="/write">
            <Feather size={18} />
            Let it out
            <ArrowRight size={18} />
          </Link>
          <div className="under-button">No right words needed. Just yours.</div>
        </motion.div>
        <div className="quiet-divider">
          <span />
          <Sparkles size={15} />
          <span />
        </div>
        <div className="invitation">
          <span>A SPACE TO SIMPLY BE</span>
          <h2>Leave a little of it here.</h2>
          <p>No audience. No expectations. No need to make sense of it all.</p>
        </div>
        <div className="feature-grid">
          <Link to="/write" className="feature-card">
            <div className="card-top">
              <span className="feature-icon lavender">
                <Feather size={22} />
              </span>
              <ArrowRight size={17} />
            </div>
            <h3>A thought, unfiltered</h3>
            <p>
              Make space for what’s on your mind.
              <br />
              It doesn’t have to be anything more.
            </p>
            <span className="card-link">
              Find your words <ArrowRight size={13} />
            </span>
          </Link>
          <Link to="/letters" className="feature-card">
            <div className="card-top">
              <span className="feature-icon rose">
                <Mail size={22} />
              </span>
              <span className="coming-label">COMING SOON</span>
            </div>
            <h3>Words never sent</h3>
            <p>
              For someone, for yourself, for no one.
              <br />
              Some letters are just for you.
            </p>
            <span className="card-link">
              Letters Never Sent <ArrowRight size={13} />
            </span>
          </Link>
          <Link to="/constellation" className="feature-card">
            <div className="card-top">
              <span className="feature-icon gold">
                <Stars size={22} />
              </span>
              <span className="coming-label">COMING SOON</span>
            </div>
            <h3>Your own little universe</h3>
            <p>
              A place for every thought.
              <br />
              Connections only you can make.
            </p>
            <span className="card-link">
              Thought Constellation <ArrowRight size={13} />
            </span>
          </Link>
        </div>
        <footer className="welcome-footer">
          <Heart size={13} />
          <span>At your pace. On your terms. Always.</span>
          <ArrowDown size={13} />
        </footer>
      </section>
    </>
  );
}
