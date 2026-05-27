import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MousePointerClick,
  Eye,
  Scroll,
  Zap,
  Shield,
  ArrowRight,
  Check,
  AlertTriangle,
  MousePointer,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          One Script Tag. Full Visibility.
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
          See exactly how users
          <br />
          <span className="text-primary">click, scroll, and interact</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
          Heatmaps, session replay, and click tracking with one lightweight
          script tag. No enterprise pricing. No complexity. Just answers.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button variant="outline" size="lg">
              See Demo
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Free plan &bull; No credit card required &bull; Setup in 2 minutes
        </p>
      </section>

      <section id="demo" className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Live heatmap preview
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Here&apos;s what a typical heatmap looks like after collecting data
          </p>
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      yoursite.com/pricing
                    </CardTitle>
                    <CardDescription>
                      2,847 clicks &bull; Last 7 days
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">7 days</Badge>
                    <Badge>Clicks</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-lg border bg-background p-8 overflow-hidden">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="h-8 w-48 mx-auto bg-muted rounded" />
                      <div className="h-4 w-64 mx-auto bg-muted rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { name: "Starter", price: "$9" },
                        { name: "Pro", price: "$29" },
                        { name: "Enterprise", price: "$99" },
                      ].map((plan) => (
                        <Card key={plan.name} className="relative">
                          <CardHeader className="pb-2">
                            <div className="h-4 w-16 bg-muted rounded" />
                            <div className="text-2xl font-bold">
                              {plan.price}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="h-3 w-full bg-muted rounded" />
                            <div className="h-3 w-3/4 bg-muted rounded" />
                            <div className="h-3 w-5/6 bg-muted rounded" />
                            <div className="h-8 w-full bg-primary/20 rounded mt-4" />
                          </CardContent>
                          {plan.name === "Pro" && (
                            <div className="absolute inset-0 rounded-lg ring-2 ring-primary" />
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute w-32 h-32 rounded-full opacity-40 blur-xl"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,165,0,0.3) 40%, transparent 70%)",
                        left: "62%",
                        top: "65%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                    <div
                      className="absolute w-24 h-24 rounded-full opacity-30 blur-xl"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,100,0,0.5) 0%, rgba(255,200,0,0.2) 40%, transparent 70%)",
                        left: "38%",
                        top: "70%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                    <div
                      className="absolute w-20 h-20 rounded-full opacity-25 blur-lg"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(0,100,255,0.4) 0%, rgba(0,200,255,0.15) 40%, transparent 70%)",
                        left: "50%",
                        top: "20%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          How it works
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Add your site",
              description:
                "Enter your domain name. We generate a unique tracking key instantly.",
              icon: Globe,
            },
            {
              step: "2",
              title: "Paste one script tag",
              description:
                "Add a single <script> tag to your site. Under 5KB. No cookies. No impact on performance.",
              icon: Zap,
            },
            {
              step: "3",
              title: "See heatmaps & replays",
              description:
                "Watch where users click, how far they scroll, and replay real sessions. Insights in minutes.",
              icon: Eye,
            },
          ].map((item) => (
            <Card key={item.step} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Step {item.step}: {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MousePointerClick,
                title: "Click Heatmaps",
                description:
                  "See exactly where users click with intensity overlays. Blue to red gradient shows hot spots.",
              },
              {
                icon: Scroll,
                title: "Scroll Depth",
                description:
                  "Know how far users scroll. Find the fold. Optimize content placement.",
              },
              {
                icon: Eye,
                title: "Session Replay",
                description:
                  "Watch real user sessions. See clicks, scrolls, and page navigation with timeline controls.",
              },
              {
                icon: AlertTriangle,
                title: "Rage Click Detection",
                description:
                  "Automatically flag frustrated users clicking repeatedly on the same element.",
              },
              {
                icon: MousePointer,
                title: "Dead Click Detection",
                description:
                  "Find elements users think are clickable but aren&apos;t. Fix UX confusion.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                description:
                  "No PII collected. No cookies required. Random visitor IDs per session. GDPR-friendly.",
              },
            ].map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-5 w-5 text-primary mb-2" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Start free. Upgrade when you need more.
        </p>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              description: "Get started with basic heatmaps",
              features: [
                "1 site",
                "1,000 sessions/mo",
                "7-day data retention",
                "Basic heatmaps",
              ],
              cta: "Get Started",
              popular: false,
            },
            {
              name: "Pro",
              price: "$9",
              description: "For growing sites that need insights",
              features: [
                "5 sites",
                "25,000 sessions/mo",
                "30-day data retention",
                "Session replay",
                "CSV exports",
                "Scroll depth charts",
              ],
              cta: "Start Pro Trial",
              popular: true,
            },
            {
              name: "Team",
              price: "$29",
              description: "For teams and high-traffic sites",
              features: [
                "20 sites",
                "100,000 sessions/mo",
                "90-day data retention",
                "Session replay",
                "CSV exports",
                "API access",
                "Team seats",
              ],
              cta: "Start Team Trial",
              popular: false,
            },
          ].map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                {plan.popular && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop guessing. Start seeing.
          </h2>
          <p className="text-lg opacity-90 mb-8">
            One script tag. Two minutes of setup. Instant insights.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}


