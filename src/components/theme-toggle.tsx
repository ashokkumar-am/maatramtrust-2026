"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { setTheme as persistTheme } from "@/app/actions/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Apply the resolved theme to <html> immediately, before the server responds. */
function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [, startTransition] = useTransition();

  // When following the system, react live to OS-level changes.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function select(next: Theme) {
    setThemeState(next);
    applyTheme(next); // instant, optimistic
    startTransition(() => {
      void persistTheme(next); // server action: persist for next SSR
    });
  }

  const ActiveIcon =
    theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Toggle theme">
            <ActiveIcon className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => select(value)}>
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {theme === value ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
