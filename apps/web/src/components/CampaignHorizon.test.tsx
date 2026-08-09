// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Campaign } from "@shi/game-core";
import campaignJson from "../generated/chapter-01-gameplay.json";
import { CampaignHorizon } from "./CampaignHorizon";

const campaign = campaignJson as unknown as Campaign;

afterEach(cleanup);

describe("authored campaign horizon", () => {
  it("exposes current time, place, and non-color act progression without controls", () => {
    const view = render(<CampaignHorizon campaign={campaign} node={campaign.nodes[0]!} locale="en" />);
    const horizon = view.getByTestId("campaign-horizon");

    expect(horizon.getAttribute("data-act-id")).toBe("register");
    expect(horizon.getAttribute("data-time-index")).toBe("0");
    expect(horizon.textContent).toContain("Scene 1 of 6");
    expect(horizon.textContent).toContain("Daze Village");
    expect(horizon.textContent).toContain("209 BCE · Seventh month");
    expect(horizon.querySelectorAll("li")).toHaveLength(3);
    expect(horizon.querySelector("[aria-current='step']")?.getAttribute("data-act-state")).toBe("current");
    expect(horizon.querySelectorAll("[data-act-state='ahead']")).toHaveLength(2);
    expect(horizon.querySelector("button")).toBeNull();

    view.rerender(<CampaignHorizon campaign={campaign} node={campaign.nodes[1]!} locale="de" />);
    expect(horizon.getAttribute("data-act-id")).toBe("organization");
    expect(horizon.textContent).toContain("Akt II · Der Preis der Organisation");
    expect(horizon.querySelectorAll("[data-act-state='passed']")).toHaveLength(1);
    expect(horizon.querySelectorAll("[data-act-state='ahead']")).toHaveLength(1);
  });
});
