"use client";

import { useState } from "react";
import TutorialDialog from "./TutorialDialog";

export default function InitialTutorial() {
  const [open, setOpen] = useState(true);

  return <TutorialDialog open={open} onOpenChange={setOpen} />;
}
