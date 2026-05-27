import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, BarChart3, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SiteDetailPage({
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

  return (
    <div className="space-y-8">
      <Link
        href="/sites"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sites
      </Link>

      <div>
        <h1 className="text-3xl font-bold">{site.name}</h1>
        <p className="text-muted-foreground">{site.domain}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Script</CardTitle>
          <CardDescription>
            Add this script tag to your website&apos;s &lt;head&gt;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <code className="text-sm break-all">
              {`<script async src="${process.env.NEXT_PUBLIC_APP_URL || "https://clickpulse.dev"}/t/${site.tracking_key}.js"></script>`}
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/sites/${siteId}/heatmap`}>
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Heatmaps</CardTitle>
                  <CardDescription>
                    See where users click on your pages
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href={`/sites/${siteId}/sessions`}>
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Sessions</CardTitle>
                  <CardDescription>
                    Replay user sessions and see interactions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
