import { cn } from "../../lib/utils";

export default function StarBorder({
  as: Component = "button",
  className = "",
  color = "#6366f1",
  speed = "6s",
  innerClassName = "",
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        "relative inline-flex p-[1px] overflow-hidden rounded-2xl bg-slate-100 shadow-sm hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-[-200%] animate-[spin_6s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg, transparent 45%, ${color} 50%, transparent 55%, ${color} 100%)`,
          animationDuration: speed,
        }}
      />
      <div className={cn("relative z-10 w-full h-full bg-white rounded-[15px] flex items-center justify-center", innerClassName)}>
        {children}
      </div>
    </Component>
  );
}
