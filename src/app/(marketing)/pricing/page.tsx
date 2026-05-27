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
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      <section className="container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold text-center mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Start free. Upgrade when you need more insights.
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
                "Basic click heatmaps",
                "Scroll depth charts",
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
                "Click heatmaps",
                "Scroll depth charts",
                "Session replay",
                "Rage & dead click detection",
                "CSV exports",
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
                "Everything in Pro",
                "API access",
                "Team seats (up to 5)",
                "Priority support",
              ],
              cta: "Start Team Trial",
              popular: false,
            },
          ].map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? "border-primary shadow-lg relative" : ""}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-4xl font-bold mt-2">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0" />
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
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: "Will the tracking script slow down my site?",
                a: "No. The script is under 2KB gzipped and loads asynchronously. It uses sendBeacon for non-blocking data transmission and has zero impact on Core Web Vitals.",
              },
              {
                q: "Is it GDPR compliant?",
                a: "Yes. We don't collect any PII, don't use cookies for tracking, and generate random visitor IDs per session. No personal data is stored.",
              },
              {
                q: "Can I use it on any website?",
                a: "Yes! The script works on any website — WordPress, Shopify, static HTML, React, Next.js, or anything else. Just add one script tag.",
              },
              {
                q: "What counts as a session?",
                a: "A session is a group of page views from the same visitor. It ends after 30 minutes of inactivity. Each session has a unique random ID.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel from your billing dashboard. You'll keep access until the end of your current billing period, then automatically downgrade to Free.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
