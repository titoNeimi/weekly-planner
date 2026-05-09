import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  getInvitationByCode,
  getTeamMember,
  isInvitationValid,
} from "@/lib/team-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await params;

  const invitation = await getInvitationByCode(code);
  if (!invitation)
    return Response.json({ error: "Not found" }, { status: 404 });

  if (!isInvitationValid(invitation)) {
    return Response.json({ error: "Expired" }, { status: 410 });
  }

  const existing = await getTeamMember(user.id, invitation.teamId);
  if (existing)
    return Response.json({ error: "Already a member" }, { status: 409 });

  await prisma.$transaction([
    prisma.teamMember.create({
      data: { teamId: invitation.teamId, userId: user.id, role: "USER" },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { uses: { increment: 1 } },
    }),
  ]);

  return Response.json({ teamId: invitation.teamId });
}
