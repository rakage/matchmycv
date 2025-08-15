import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});

export const STRIPE_CONFIG = {
  plans: {
    free: {
      name: "Free",
      features: ["5 CV analyses per month", "Basic scoring", "PDF export"],
      limits: {
        analyses: 5,
        exports: 10,
      },
    },
    pro: {
      name: "Pro",
      features: [
        "Unlimited CV analyses",
        "Advanced AI editor",
        "Priority support",
        "Export to PDF & DOCX",
        "Version history",
        "Custom templates",
      ],
      limits: {
        analyses: -1, // unlimited
        exports: -1,
      },
      monthlyPriceId: process.env.STRIPE_PRICE_ID_MONTHLY,
      yearlyPriceId: process.env.STRIPE_PRICE_ID_YEARLY,
    },
  },
};

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  customerId?: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_creation: customerId ? undefined : "always",
    payment_method_types: ["card"],
    billing_address_collection: "required",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      userId,
    },
  });

  return session;
}

export async function createBillingPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
  });

  return session;
}

export async function getUserSubscription(stripeCustomerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    expand: ["data.default_payment_method"],
  });

  return subscriptions.data[0] || null;
}
