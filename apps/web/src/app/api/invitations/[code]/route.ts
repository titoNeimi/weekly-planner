import { getInvitationByCode, isInvitationValid } from "@/lib/team-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const invitation = await getInvitationByCode(code);
  if (!invitation)
    return Response.json({ error: "Not found" }, { status: 404 });

  if (!isInvitationValid(invitation)) {
    return Response.json({ error: "Expired" }, { status: 410 });
  }

  return Response.json({
    teamId: invitation.teamId,
    teamName: invitation.team.name,
  });
}
