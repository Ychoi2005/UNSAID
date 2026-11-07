import { PageTitle } from "./ui";
export default function Support() {
  return (
    <section className="page support">
      <PageTitle
        number="—"
        title="A little support."
        description="UNSAID is a place to write. It is not therapy or an emergency service."
      />
      <h2>You can stop here, any time.</h2>
      <p>
        Nothing here monitors, diagnoses, or analyses your writing. If you need
        support beyond the page, a qualified professional or someone you trust
        may be able to help.
      </p>
      <h2>If you need immediate help</h2>
      <p>
        If you or someone else is in immediate danger, contact your local
        emergency services.
      </p>
      <ul>
        <li>
          Australia: <a href="tel:131114">Lifeline 13 11 14</a> —{" "}
          <a
            href="https://www.lifeline.org.au"
            target="_blank"
            rel="noreferrer"
          >
            lifeline.org.au
          </a>
        </li>
        <li>
          US & Canada: call or text <a href="tel:988">988</a>
        </li>
        <li>
          Other countries:{" "}
          <a href="https://findahelpline.com" target="_blank" rel="noreferrer">
            Find a Helpline
          </a>
        </li>
      </ul>
      <p className="small-note">
        External websites have their own privacy policies. UNSAID does not send
        your writing to them.
      </p>
    </section>
  );
}
