import { requireRole } from "@backend/auth/page-guard";
import { listAssets, listMovements } from "@backend/services/asset.service";
import { prisma } from "@backend/prisma";
import { AssetsContent } from "./AssetsContent";
import { MobileAssetsContent } from "@/screens/mobile/MobileAssetsContent/MobileAssetsContent";

export const dynamic = "force-dynamic";

export async function AssetsScreen() {
  await requireRole("super_admin", "principal", "staff");

  const [assets, movements, staff] = await Promise.all([
    listAssets(),
    listMovements(),
    prisma.staff.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: [{ firstName: "asc" }] }),
  ]);

  const assetRows = assets.map((a) => ({
    id: a.id,
    tag: a.tag,
    name: a.name,
    category: a.category,
    status: a.status,
    location: a.location,
    custodianId: a.custodianId,
    custodianName: a.custodian ? `${a.custodian.firstName} ${a.custodian.lastName}` : null,
    quantity: a.quantity,
    value: a.value !== null ? Number(a.value) : null,
    imageUrl: a.imageUrl,
    movementCount: a._count.movements,
  }));
  const movementRows = movements.map((m) => ({
    id: m.id,
    assetName: m.asset.name,
    assetTag: m.asset.tag,
    type: m.type,
    quantity: m.quantity,
    note: m.note,
    actedByName: m.actedBy.name,
    createdAt: m.createdAt.toISOString(),
  }));
  const staffRows = staff.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));

  return (
    <>
      <div className="mobileOnly">
        <MobileAssetsContent assets={assetRows} movements={movementRows} staff={staffRows} />
      </div>
      <div className="desktopOnly">
        <AssetsContent assets={assetRows} movements={movementRows} staff={staffRows} />
      </div>
    </>
  );
}
