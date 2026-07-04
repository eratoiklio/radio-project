import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

describe("Loading", () => {
    it("announces that the episode list is loading", () => {
        const { container } = render(<Loading />);

        expect(screen.getByText("Ładowanie listy odcinków…")).toBeInTheDocument();
        expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
        expect(container.querySelectorAll("li")).toHaveLength(10);
    });
});
