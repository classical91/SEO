"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@rankforge/ui";

export function SignOutButton() {
  return (
    <Button className="gap-2" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })} type="button">
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
