import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

Object.defineProperties(HTMLMediaElement.prototype, {
    load: {
        configurable: true,
        value: vi.fn(),
    },
    pause: {
        configurable: true,
        value: vi.fn(),
    },
    play: {
        configurable: true,
        value: vi.fn().mockResolvedValue(undefined),
    },
});

class IntersectionObserverMock implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];

    disconnect() {}
    observe() {}
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
    unobserve() {}
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => ({
        drawImage: vi.fn(),
    })),
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
});

Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
});
