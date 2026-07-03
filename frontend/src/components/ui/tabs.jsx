import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>} props
   * @param {React.ForwardedRef<HTMLDivElement>} ref
   */
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 p-1 text-slate-500",
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>} props
   * @param {React.ForwardedRef<HTMLButtonElement>} ref
   */
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-bold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(
  /**
   * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>} props
   * @param {React.ForwardedRef<HTMLDivElement>} ref
   */
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
