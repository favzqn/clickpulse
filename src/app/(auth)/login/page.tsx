import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { MousePointerClick } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect(redirectTo || "/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <MousePointerClick className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ClickPulse</span>
          </div>
          <p className="text-muted-foreground">
            Sign in to view your heatmaps
          </p>
        </div>
        <AuthButtons redirectTo={redirectTo} />
        <p className="text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
