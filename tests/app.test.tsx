import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import { openDB } from "idb";
import App from "../src/app/App";
import { Confirm } from "../src/components/ui";
import userEvent from "@testing-library/user-event";
beforeEach(async () => {
  const db = await openDB("unsaid-encrypted", 1, {
    upgrade(d) {
      d.createObjectStore("vault");
    },
  });
  await db.clear("vault");
  db.close();
});
it("requires explicit vault setup and explains recovery and review limits", async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("button", { name: "Create your vault" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Choose a passphrase")).toHaveAttribute(
    "type",
    "password",
  );
  expect(
    screen.getByText(/Not independently security-reviewed/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: "Your thought" }),
  ).not.toBeInTheDocument();
});
it("uses a native accessible dialog for destructive confirmation", async () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  let canceled = false;
  render(
    <Confirm
      title="Let this go?"
      description="This cannot be undone."
      onCancel={() => {
        canceled = true;
      }}
      onConfirm={() => {}}
    />,
  );
  expect(
    screen.getByRole("dialog", { name: "Let this go?" }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(canceled).toBe(true);
});
