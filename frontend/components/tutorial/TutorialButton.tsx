"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import TutorialDialog from "./TutorialDialog";

export default function TutorialButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <HelpCircle className="w-4 h-4" />
        使い方
      </Button>
      <TutorialDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
