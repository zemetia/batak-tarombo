
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { getYear, setYear, getMonth, setMonth, format } from "date-fns"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<"days" | "months" | "years">("days")
  const [currentDate, setCurrentDate] = React.useState(props.month || new Date())

  const handleMonthChange = (month: Date) => {
    setCurrentDate(month)
    if (props.onMonthChange) {
      props.onMonthChange(month)
    }
  }

  const handleMonthSelect = (month: number) => {
    const newDate = setMonth(currentDate, month)
    handleMonthChange(newDate)
    setView("days")
  }

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentDate, year)
    handleMonthChange(newDate)
    setView("months")
  }

  const startYear = getYear(currentDate) - 11

  const CustomCaption = () => {
    return (
      <div className="flex justify-center items-center gap-2 mb-4">
        {view === 'days' && (
          <div className="flex items-center gap-2">
            <button
                onClick={() => handleMonthChange(setMonth(currentDate, getMonth(currentDate) - 1))}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <span
              className="text-lg font-headline cursor-pointer"
              onClick={() => setView("months")}
            >
              {format(currentDate, "MMMM yyyy")}
            </span>
             <button
                onClick={() => handleMonthChange(setMonth(currentDate, getMonth(currentDate) + 1))}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
            >
                <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
         {view === "months" && (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleMonthChange(setYear(currentDate, getYear(currentDate) - 1))}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span
                    className="text-lg font-headline cursor-pointer"
                    onClick={() => setView("years")}
                >
                    {getYear(currentDate)}
                </span>
                <button
                    onClick={() => handleMonthChange(setYear(currentDate, getYear(currentDate) + 1))}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        )}
        {view === "years" && (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleMonthChange(setYear(currentDate, startYear - 1))}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-lg font-headline">
                    {`${startYear} - ${startYear + 11}`}
                </span>
                <button
                    onClick={() => handleMonthChange(setYear(currentDate, startYear + 12))}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        )}
      </div>
    );
  };


  return (
    <div className="p-3">
      <CustomCaption />
      {view === "days" && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          className={cn("p-0", className)}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            ...classNames,
          }}
          month={currentDate}
          onMonthChange={handleMonthChange}
          {...props}
          components={{
            ...props.components,
            Caption: () => null, // Hide default caption
          }}
        />
      )}
      {view === "months" && (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleMonthSelect(i)}
              className={cn(
                buttonVariants({ variant: getMonth(new Date()) === i && getYear(new Date()) === getYear(currentDate) ? "default" : "ghost" }),
                "w-full"
              )}
            >
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </button>
          ))}
        </div>
      )}
      {view === "years" && (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const year = startYear + i
            return (
              <button
                key={i}
                onClick={() => handleYearSelect(year)}
                className={cn(
                  buttonVariants({ variant: getYear(new Date()) === year ? "default" : "ghost" }),
                  "w-full"
                )}
              >
                {year}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
