import { useRef, useEffect, useState } from "react";

/**
 * @param {{
 *   text?: string;
 *   delay?: number;
 *   className?: string;
 *   animateBy?: "letters" | "words";
 *   direction?: "top" | "bottom";
 *   threshold?: number;
 *   rootMargin?: string;
 *   onAnimationComplete?: () => void;
 * }} props
 */
export default function BlurText({
  text = "",
  delay = 0.05,
  className = "",
  animateBy = "letters",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  onAnimationComplete = undefined,
}) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  const animatedCount = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {elements.map((element, index) => (
        <span
          key={index}
          className="inline-block transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            filter: inView ? "blur(0px)" : "blur(10px)",
            transform: inView
              ? "translate3d(0,0,0) scale(1)"
              : `translate3d(0, ${direction === "top" ? "-20px" : "20px"}, 0) scale(0.8)`,
            transitionDelay: `${index * delay}s`,
            marginRight: animateBy === "words" ? "0.25em" : "0px",
            whiteSpace: element === " " ? "pre" : "normal",
          }}
          onTransitionEnd={() => {
            animatedCount.current += 1;
            if (animatedCount.current === elements.length && onAnimationComplete) {
              onAnimationComplete();
            }
          }}
        >
          {element}
        </span>
      ))}
    </span>
  );
}
