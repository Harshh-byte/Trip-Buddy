import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../lib/utils";

const AccordionContext = createContext(/** @type {any} */ (null));

/**
 * @param {{
 *   type?: "single" | "multiple";
 *   value?: any;
 *   defaultValue?: any;
 *   onValueChange?: (value: any) => void;
 *   className?: string;
 *   children?: any;
 *   [key: string]: any;
 * }} props
 */
function Accordion({
  type = "single",
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() => {
    if (defaultValue !== undefined) return defaultValue;
    return type === "multiple" ? [] : undefined;
  });

  const currentValue = isControlled ? value : uncontrolledValue;

  const contextValue = useMemo(
    () => ({
      type,
      value: currentValue,
      setValue: (/** @type {any} */ nextValue) => {
        if (!isControlled) {
          setUncontrolledValue(nextValue);
        }
        onValueChange?.(nextValue);
      },
    }),
    [currentValue, isControlled, onValueChange, type],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div data-slot="accordion" className={className} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

/** @param {any} itemValue */
function useAccordionItemState(itemValue) {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within <Accordion />");
  }

  const isOpen = useMemo(() => {
    if (context.type === "multiple") {
      return Array.isArray(context.value)
        ? context.value.includes(itemValue)
        : false;
    }

    return context.value === itemValue;
  }, [context.type, context.value, itemValue]);

  const toggle = () => {
    if (context.type === "multiple") {
      const current = Array.isArray(context.value) ? context.value : [];
      const next = current.includes(itemValue)
        ? current.filter((/** @type {any} */ value) => value !== itemValue)
        : [...current, itemValue];
      context.setValue(next);
      return;
    }

    context.setValue(context.value === itemValue ? undefined : itemValue);
  };

  return { isOpen, toggle };
}

/**
 * @param {{
 *   className?: string;
 *   children?: any;
 *   showIcon?: boolean;
 *   [key: string]: any;
 * }} props
 */
function AccordionTrigger({ className, children, showIcon = true, ...props }) {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionTrigger must be used within <Accordion />");
  }

  const parentItem = useContext(AccordionItemContext);
  const isOpen = parentItem?.isOpen ?? false;
  const toggle = parentItem?.toggle;

  return (
    <button
      type="button"
      data-slot="accordion-trigger"
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-md text-left text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={toggle}
      {...props}
    >
      {children}
      {showIcon && (
        <ChevronDownIcon
          className={cn(
            "pointer-events-none size-6 shrink-0 text-black transition-transform duration-300 md:size-7",
            isOpen && "rotate-180",
          )}
        />
      )}
    </button>
  );
}

const AccordionItemContext = createContext(/** @type {any} */ (null));

/**
 * @param {{
 *   className?: string;
 *   children?: any;
 *   [key: string]: any;
 * }} props
 */
function AccordionContent({ className, children, ...props }) {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionContent must be used within <Accordion />");
  }

  const parentItem = useContext(AccordionItemContext);
  const isOpen = parentItem?.isOpen ?? false;
  const contentRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [maxHeight, setMaxHeight] = useState("0px");

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    if (isOpen) {
      setMaxHeight(`${element.scrollHeight}px`);
      return;
    }

    setMaxHeight("0px");
  }, [isOpen, children]);

  useEffect(() => {
    if (!isOpen) return;

    const element = contentRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(() => {
      setMaxHeight(`${element.scrollHeight}px`);
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [isOpen]);

  return (
    <div
      data-slot="accordion-content"
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "grid overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{ maxHeight }}
      {...props}
    >
      <div ref={contentRef} className="overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   value: any;
 *   children?: any;
 *   className?: string;
 *   [key: string]: any;
 * }} props
 */
function AccordionItemWrapper({ value, children, className, ...props }) {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionItem must be used within <Accordion />");
  }

  const itemState = useAccordionItemState(value);

  return (
    <AccordionItemContext.Provider value={itemState}>
      <div
        data-slot="accordion-item"
        data-state={itemState.isOpen ? "open" : "closed"}
        data-value={value}
        className={cn(className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

const AccordionItemExport = AccordionItemWrapper;

export {
  Accordion,
  AccordionContent,
  AccordionItemExport as AccordionItem,
  AccordionTrigger,
};
