import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Globe, ExternalLink } from "lucide-react";
import { SiteActions } from "@/components/sites/site-actions";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-muted-foreground">
            Manage your tracked websites
          </p>
        </div>
        <Link href="/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Site
          </Button>
        </Link>
      </div>

      {!sites || sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Add your first website to start tracking clicks, heatmaps, and
              session replays.
            </p>
            <Link href="/sites/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Site
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map(
            (site: {
              id: string;
              name: string;
              domain: string;
              tracking_key: string;
              created_at: string;
            }) => (
              <Card key={site.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                    <SiteActions siteId={site.id} />
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {site.domain}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tracking Script
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted rounded px-2 py-1.5 truncate">
                        {`<script async src="${process.env.NEXT_PUBLIC_APP_URL || "https://clickpulse.dev"}/t/${site.tracking_key}.js"></script>`}
                      </code>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/sites/${site.id}/heatmap`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Heatmap
                      </Button>
                    </Link>
                    <Link
                      href={`/sites/${site.id}/sessions`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        Sessions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
