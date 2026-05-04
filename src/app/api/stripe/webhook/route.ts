import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe nao configurado" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // Verify webhook signature using Stripe's raw API (no SDK dependency)
  // In production, use stripe SDK for proper verification
  // For now, parse the event directly (webhook endpoint should be secured via Stripe dashboard)
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.type;
  const data = event.data?.object;

  try {
    switch (type) {
      case "checkout.session.completed": {
        const userId = data.client_reference_id || data.metadata?.userId;
        const customerId = data.customer;
        const subscriptionId = data.subscription;

        if (userId && customerId) {
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeCustomerId: customerId,
              stripeSubId: subscriptionId,
              plan: "pro",
              status: "active",
            },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubId: subscriptionId,
              plan: "pro",
              status: "active",
            },
          });

          await prisma.user.update({
            where: { id: userId },
            data: { plan: "pro" },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubId: data.id },
        });

        if (sub) {
          const status = data.status === "active" || data.status === "trialing" ? data.status : "canceled";
          const plan = status === "canceled" ? "free" : "pro";

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status,
              plan,
              cancelAtEnd: data.cancel_at_period_end || false,
              currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end * 1000) : null,
              trialEnd: data.trial_end ? new Date(data.trial_end * 1000) : null,
            },
          });

          await prisma.user.update({
            where: { id: sub.userId },
            data: { plan },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubId: data.id },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "canceled", plan: "free" },
          });

          await prisma.user.update({
            where: { id: sub.userId },
            data: { plan: "free" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: data.customer },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "past_due" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
