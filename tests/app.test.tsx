import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import App from "../src/app/App";
it("offers an account-free writing path with an explicit privacy notice", async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: /Some thoughts are easier/ }),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole("link", { name: "Let it out" }));
  expect(
    await screen.findByRole("textbox", { name: "Your thought" }),
  ).toBeInTheDocument();
  expect(screen.getByText("without encryption")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Keep this thought" }),
  ).toBeDisabled();
});
it("clearly identifies later phases as unavailable", () => {
  render(
    <MemoryRouter initialEntries={["/letters"]}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: "Letters Never Sent" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/not available in this foundation version/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /send/i }),
  ).not.toBeInTheDocument();
});
