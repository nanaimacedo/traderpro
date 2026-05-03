import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webPush, getRandomMorningMessage } from '@/lib/web-push';

// GET — chamado pelo Vercel Cron ou servico externo todo dia as 7:30 BRT
// Configura no vercel.json: { "crons": [{ "path": "/api/cron/morning-notification", "schedule": "30 10 * * 1-5" }] }
// 10:30 UTC = 7:30 BRT (dias uteis seg-sex)
export async function GET(request: NextRequest) {
  // Verificar autorizacao
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { active: true },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'Nenhum inscrito', sent: 0 });
    }

    const message = getRandomMorningMessage();
    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
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

    // Log
    await prisma.notificationLog.create({
      data: {
        title: message.title,
        body: message.body,
        success,
        failed,
      },
    });

    return NextResponse.json({
      message: 'Notificacao matinal enviada',
      success,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Erro no cron de notificacao:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
