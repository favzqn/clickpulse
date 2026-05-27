import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanType } from "@/lib/types";
import { ManageBillingButton } from "@/components/sites/manage-billing-button";
import { UpgradeButton } from "@/components/sites/upgrade-button";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { count: siteCount } = await supabase
    .from("sites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const plan: PlanType = (subscription?.plan as PlanType) || "free";
  const limits = PLAN_LIMITS[plan];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {plan === "free"
                  ? "You are on the Free plan"
                  : `You are on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`}
              </CardDescription>
            </div>
            <Badge variant={plan === "free" ? "secondary" : "default"}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sites</p>
              <p className="text-2xl font-bold">
                {siteCount || 0} / {limits.maxSites}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Data Retention</p>
              <p className="text-2xl font-bold">{limits.retentionDays} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Sessions / month
              </p>
              <p className="text-2xl font-bold">
                {limits.maxSessionsPerMonth.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Session Replay</p>
              <p className="text-2xl font-bold">
                {limits.sessionReplay ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {subscription?.stripe_customer_id ? (
            <ManageBillingButton />
          ) : plan === "free" ? (
            <div className="flex gap-2">
              <UpgradeButton priceId="pro" planName="Pro" />
              <UpgradeButton priceId="team" planName="Team" />
            </div>
          ) : null}

          {subscription?.current_period_end && (
            <p className="text-xs text-muted-foreground">
              Current period ends:{" "}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
