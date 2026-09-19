"use client";

import { UserMenu } from "@/components/user-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

interface HeaderProps {
  leftContent?: React.ReactNode;
}

export function Header({ leftContent }: HeaderProps) {
  return (
    <header className="flex justify-between p-2 border-b">
      <div className="flex items-center gap-2">{leftContent}</div>
      <div className="flex items-center gap-2">
        <NotificationsDropdown />
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
