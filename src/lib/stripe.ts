import Stripe from "stripe";
import type { PlanType } from "./types";
import { PLAN_LIMITS } from "./constants";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS: Record<
  PlanType,
  {
    name: string;
    description: string;
    price: number;
    priceId?: string;
    features: string[];
  }
> = {
  free: {
    name: "Free",
    description: "Get started with basic heatmaps",
    price: 0,
    features: [
      "1 site",
      "1,000 sessions/mo",
      "7-day data retention",
      "Basic heatmaps",
    ],
  },
  pro: {
    name: "Pro",
    description: "For growing sites that need insights",
    price: 9,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "5 sites",
      "25,000 sessions/mo",
      "30-day data retention",
      "Session replay",
      "CSV exports",
      "Scroll depth charts",
    ],
  },
  team: {
    name: "Team",
    description: "For teams and high-traffic sites",
    price: 29,
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
    features: [
      "20 sites",
      "100,000 sessions/mo",
      "90-day data retention",
      "Session replay",
      "CSV exports",
      "API access",
      "Team seats",
    ],
  },
};

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan];
}
