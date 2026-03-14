"use client";

import { useEffect, useState } from "react";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > 200);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window === "undefined") return;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 ease-out hover:bg-primary/90 ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-20 opacity-0 pointer-events-none"
      }`}
      aria-label="Scroll to top"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5l-6 6" />
        <path d="M12 5l6 6" />
        <path d="M12 5v14" />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;
