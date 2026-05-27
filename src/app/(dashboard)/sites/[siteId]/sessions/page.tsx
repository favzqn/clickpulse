import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Clock, Smartphone, Monitor, Tablet } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function formatDuration(start: string, end: string | null): string {
  if (!end) return "Active";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function getDeviceIcon(type: string | null) {
  switch (type) {
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "tablet":
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .single();

  if (!site) redirect("/sites");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("site_id", siteId)
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <Link
        href={`/sites/${siteId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {site.name}
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">
          {sessions?.length || 0} sessions recorded
        </p>
      </div>

      {!sessions || sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Eye className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Install the tracking script on your site to start recording
              sessions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(
            (session: {
              id: string;
              visitor_id: string;
              started_at: string;
              ended_at: string | null;
              page_count: number;
              device_type: string | null;
              viewport_width: number | null;
              viewport_height: number | null;
            }) => (
              <Link
                key={session.id}
                href={`/sites/${siteId}/sessions/${session.id}`}
              >
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getDeviceIcon(session.device_type)}
                        <span className="text-xs capitalize">
                          {session.device_type || "desktop"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {session.visitor_id.slice(0, 16)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">
                          {session.page_count || 0} pages
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(
                            session.started_at,
                            session.ended_at
                          )}
                        </p>
                      </div>
                      {session.viewport_width && (
                        <Badge variant="outline" className="text-xs">
                          {session.viewport_width}×{session.viewport_height}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
