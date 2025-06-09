import { NEXT_PUBLIC_PUSHER_CLUSTER, NEXT_PUBLIC_PUSHER_KEY } from '@env';
import Pusher from 'pusher-js';

interface DeliveryLocationPayload {
  deliveryId: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
  status: string;
}

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;

  constructor() {
    this.initializePusher();
  }

  private initializePusher() {
    try {
      this.pusher = new Pusher(NEXT_PUBLIC_PUSHER_KEY, {
        cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
        // Configurações adicionais para debugging
        enabledTransports: ['ws', 'wss'],
        forceTLS: true
      });

      // MUDANÇA: Usar canal público ao invés de privado
      this.channel = this.pusher.subscribe('delivery-realtime'); // Removido 'private-'

      // Listeners para debugging
      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ Inscrito no canal com sucesso');
      });

      this.channel.bind('pusher:subscription_error', (error: any) => {
        console.error('❌ Erro na inscrição do canal:', error);
      });

      this.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher conectado');
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('❌ Erro de conexão Pusher:', error);
      });

      console.log('Pusher inicializado');
    } catch (error) {
      console.error('Erro ao inicializar Pusher:', error);
    }
  }

  async sendDeliveryLocation(payload: DeliveryLocationPayload): Promise<void> {
    if (!this.channel) {
      throw new Error('Pusher não inicializado');
    }

    if (!this.pusher?.connection.state) {
      throw new Error('Pusher não conectado');
    }

    try {
      // MUDANÇA: Para canal público, você precisa enviar via servidor
      
      // Opção 1: Enviar via seu backend
      console.warn('Para canal público, envie via seu servidor backend');
      
      // Opção 2: Se quiser manter client events, use canal privado com autenticação
      
    } catch (error) {
      console.error('Erro ao disparar evento:', error);
      throw error;
    }
  }

  // Escuta atualizações de pedidos
  subscribeToOrderUpdates(callback: (data: any) => void): void {
    if (this.channel) {
      this.channel.bind('order-update', callback);
    }
  }

  // Escuta atualizações de localização (para receber de outros clientes)
  subscribeToLocationUpdates(callback: (data: any) => void): void {
    if (this.channel) {
      this.channel.bind('location-update', callback);
    }
  }

  // Desconecta do Pusher
  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
    }
  }

  // Getter para verificar status da conexão
  get isConnected(): boolean {
    return this.pusher?.connection.state === 'connected';
  }
}

export const pusherService = new PusherService();