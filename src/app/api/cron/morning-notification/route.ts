import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webPush, getRandomMorningMessage } from '@/lib/web-push';
import { getTodayEvents, syncCalendarEvents } from '@/lib/economic-calendar';

// GET — chamado pelo Vercel Cron todo dia as 7:30 BRT
// vercel.json: { "path": "/api/cron/morning-notification", "schedule": "30 10 * * 1-5" }
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  try {
    // Sync calendar events (ensures today's events exist)
    await syncCalendarEvents(1);

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { active: true },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'Nenhum inscrito', sent: 0 });
    }

    // Get today's economic events
    const todayEvents = await getTodayEvents();
    const highEvents = todayEvents.filter((e) => e.impact === 'HIGH');

    // Build notification message
    const message = getRandomMorningMessage();
    let body = message.body;

    if (highEvents.length > 0) {
      const eventNames = highEvents
        .map((e) => {
          const brtH = e.time ? parseInt(e.time.split(':')[0]) - 3 : null;
          const timeStr = brtH != null ? `${String(brtH < 0 ? brtH + 24 : brtH).padStart(2, '0')}:${e.time!.split(':')[1]}` : '';
          return `${e.title}${timeStr ? ` (${timeStr})` : ''}`;
        })
        .join(', ');
      body += `\n⚠️ ALERTA: ${highEvents.length} evento(s) de alto impacto hoje: ${eventNames}`;
    }

    const payload = JSON.stringify({
      title: message.title,
      body,
      url: '/dashboard',
    });

    let success = 0;
    let failed = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          success++;
        } catch (error: unknown) {
          failed++;
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const statusCode = (error as { statusCode: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await prisma.pushSubscription.update({
                where: { id: sub.id },
                data: { active: false },
              });
            }
          }
        }
      })
    );

    await prisma.notificationLog.create({
      data: {
        title: message.title,
        body,
        success,
        failed,
      },
    });

    return NextResponse.json({
      message: 'Notificacao matinal enviada',
      calendarEvents: todayEvents.length,
      highImpact: highEvents.length,
      success,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Erro no cron de notificacao:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
