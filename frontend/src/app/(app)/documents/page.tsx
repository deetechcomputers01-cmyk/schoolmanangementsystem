import { getCurrentUser } from "@backend/auth/cookies";
import { listDocuments, getDocumentStats, getFolderCounts } from "@backend/services/documents.service";
import { redirect } from "next/navigation";
import { DocumentCenterScreen } from "@/screens/desktop/DocumentCenterScreen/DocumentCenterScreen";
import { MobileDocumentCenterContent } from "@/screens/mobile/MobileDocumentCenterContent/MobileDocumentCenterContent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Document Center – ScholarSphere" };

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin" && user.role !== "principal") redirect("/dashboard");

  const [docs, stats, folders] = await Promise.all([
    listDocuments(),
    getDocumentStats(),
    getFolderCounts(),
  ]);

  return (
    <>
      <div className="mobileOnly">
        <MobileDocumentCenterContent initialDocs={docs as any} initialStats={stats} initialFolders={folders} />
      </div>
      <div className="desktopOnly">
        <DocumentCenterScreen initialDocs={docs as any} initialStats={stats} initialFolders={folders} />
      </div>
    </>
  );
}
