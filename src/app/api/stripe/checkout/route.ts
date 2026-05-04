import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe nao configurado" }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { subscription: true },
  });

  if (!user) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });

  // If already has Stripe customer, use portal instead
  if (user.subscription?.stripeCustomerId) {
    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: user.subscription.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://traderpro-ashy.vercel.app"}/`,
      }),
    });

    if (portalRes.ok) {
      const portal = await portalRes.json();
      return NextResponse.json({ url: portal.url });
    }
  }

  // Create checkout session
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "STRIPE_PRO_PRICE_ID nao configurado" }, { status: 500 });
  }

  const params = new URLSearchParams({
    "mode": "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "success_url": `${process.env.NEXT_PUBLIC_APP_URL || "https://traderpro-ashy.vercel.app"}/?upgrade=success`,
    "cancel_url": `${process.env.NEXT_PUBLIC_APP_URL || "https://traderpro-ashy.vercel.app"}/pricing`,
    "customer_email": user.email,
    "client_reference_id": user.id,
    "subscription_data[trial_period_days]": "7",
    "metadata[userId]": user.id,
  });

  const checkoutRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!checkoutRes.ok) {
    const err = await checkoutRes.text();
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }

  const checkout = await checkoutRes.json();
  return NextResponse.json({ url: checkout.url });
}
