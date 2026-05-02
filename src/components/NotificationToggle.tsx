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

  // Permissao negada permanentemente
  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-800/30 bg-red-950/20 px-3 py-2 text-sm text-red-400">
        <BellOff className="h-4 w-4" />
        <span>Notificacoes bloqueadas no navegador</span>
      </div>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribePush : subscribePush}
      disabled={loading}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        isSubscribed
          ? 'border border-green-800/30 bg-green-950/20 text-green-400 hover:bg-green-950/40'
          : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      } disabled:opacity-50`}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      <span>{isSubscribed ? 'Notificacoes ativas' : 'Ativar notificacoes'}</span>
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
