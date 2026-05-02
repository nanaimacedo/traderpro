'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

export function NotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setPermission(Notification.permission);

    // Verificar se ja tem subscription ativa
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function subscribePush() {
    setLoading(true);
    try {
      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Pedir permissao
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      // Criar subscription
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('VAPID key nao configurada');
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
      });

      // Enviar subscription para o backend
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (res.ok) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Erro ao ativar notificacoes:', error);
    }
    setLoading(false);
  }

  async function unsubscribePush() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Desativar no backend
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error('Erro ao desativar notificacoes:', error);
    }
    setLoading(false);
  }

  // Navegador nao suporta
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  // Permissão negada permanentemente
  if (permission === 'denied') {
    return (
      <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-rose-400 cursor-not-allowed" title="Notificações bloqueadas no navegador">
        <BellOff className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribePush : subscribePush}
      disabled={loading}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
        isSubscribed
          ? 'text-emerald-600 hover:bg-emerald-50'
          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
      }`}
      title={isSubscribed ? 'Notificações ativas' : 'Ativar notificações'}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isSubscribed ? (
        <>
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
        </>
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </button>
  );
}

// Converte VAPID key base64 para Uint8Array (necessario para pushManager.subscribe)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
