import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

/**
 * @param {{
 * className?: string;
 * classNames?: Record<string, string>;
 * showOutsideDays?: boolean;
 * [key: string]: any;
 * }} props
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  const today = new Date();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      startMonth={today}
      disabled={{ before: today }}
      className={cn("p-4 bg-white rounded-xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",

        month_caption: "flex justify-center pt-1 relative items-center h-10",
        caption_label: "text-sm font-bold text-gray-900",

        nav: "flex items-center absolute w-full left-0 right-0 justify-between px-2",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 rounded-xl border-gray-100 disabled:opacity-20 z-10",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 rounded-xl border-gray-100 z-10",
        ),

        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-indigo-400 rounded-md w-9 font-bold text-[0.7rem] uppercase tracking-tighter",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative",

        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal rounded-xl aria-selected:opacity-100 transition-colors aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent",
        ),

        selected:
          "bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100",

        today:
          "bg-orange-50 text-orange-600 font-bold border border-orange-100",

        disabled: "text-gray-500 opacity-70 cursor-not-allowed",

        outside: "text-gray-200 opacity-20",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft
              className={cn("h-4 w-4", iconClassName)}
              {...iconProps}
            />
          ) : (
            <ChevronRight
              className={cn("h-4 w-4", iconClassName)}
              {...iconProps}
            />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
