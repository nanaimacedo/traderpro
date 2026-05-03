import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { webPush, getRandomMorningMessage } from '@/lib/web-push';

// POST — dispara notificacao para todos os inscritos
// Protegido por CRON_SECRET para evitar disparo nao autorizado
export async function POST(request: NextRequest) {
  try {
    // Verificar autorizacao (cron secret ou chamada interna)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    // Buscar mensagem customizada do body ou usar aleatoria
    let title: string;
    let body: string;

    try {
      const payload = await request.json();
      title = payload.title;
      body = payload.body;
    } catch {
      // Se nao tem body, usa mensagem aleatoria
      const message = getRandomMorningMessage();
      title = message.title;
      body = message.body;
    }

    // Buscar todas as subscriptions ativas
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { active: true },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'Nenhum inscrito ativo', sent: 0 });
    }

    const payload = JSON.stringify({ title, body, url: '/dashboard' });

    let success = 0;
    let failed = 0;

    // Enviar para cada inscrito
    const results = await Promise.allSettled(
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
          // Se o endpoint expirou (410 Gone), desativar
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

    // Registrar log
    await prisma.notificationLog.create({
      data: { title, body, success, failed },
    });

    return NextResponse.json({
      message: `Notificacoes enviadas`,
      success,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Erro ao enviar notificacoes:', error);
    return NextResponse.json(
      { error: 'Erro interno ao enviar notificacoes' },
      { status: 500 }
    );
  }
}
