import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

describe("ErrorPage", () => {
    it("shows a safe message and retries through reset", () => {
        const reset = vi.fn();
        render(
            <ErrorPage
                error={new Error("database password and stack trace")}
                reset={reset}
            />,
        );

        expect(
            screen.getByText("Nie udało się pobrać odcinków"),
        ).toBeInTheDocument();
        expect(screen.queryByText(/database password/)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Ponów próbę" }));
        expect(reset).toHaveBeenCalledOnce();
    });
});
