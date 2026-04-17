import React, { useEffect, useState, useRef } from "react";

const Cursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef(null);

  useEffect(() => {
    /** @param {MouseEvent} e */
    const updatePosition = (e) => {
      if (!isVisible) setIsVisible(true);

      if (cursorRef.current) {
        /** @type {HTMLDivElement} */ (cursorRef.current).style.transform =
          `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.body.style.cursor = "none";

    window.addEventListener("mousemove", updatePosition);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.body.style.cursor = "auto";
    };
  }, [isVisible]);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "32px",
        height: "32px",
        pointerEvents: "none",
        zIndex: 9999,
        marginLeft: "-2px",
        marginTop: "-2px",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
        willChange: "transform",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="40"
        viewBox="0 0 32 32"
      >
        <path
          d="M 2 2 L 2 24 L 8 18 L 20 16 Z"
          fill="white"
          stroke="black"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Cursor;
