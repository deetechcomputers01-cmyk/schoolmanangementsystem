import type { StitchTemplatePair } from "@/types/stitch";
import { StitchTemplateFrame } from "./StitchTemplateFrame";

export function StitchTemplatePage({ template, title }: { template: StitchTemplatePair; title: string }) {
  return (
    <main className="min-h-screen bg-white">
      <StitchTemplateFrame template={template} title={title} />
    </main>
  );
}
