"use client";

import { useEffect, useState } from "react";
import type { StitchTemplatePair } from "@/types/stitch";

export function StitchTemplateFrame({ template, title }: { template: StitchTemplatePair; title: string }) {
  const [src, setSrc] = useState(template.desktop);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setSrc(media.matches && template.mobile ? template.mobile : template.desktop);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [template.desktop, template.mobile]);

  return (
    <iframe
      className="h-screen w-full border-0 bg-white"
      src={src}
      title={title}
    />
  );
}
