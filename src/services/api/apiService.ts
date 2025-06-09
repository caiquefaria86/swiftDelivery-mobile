import { NEXT_PUBLIC_API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData } from '../location/locationService';

interface DeliveryLocationPayload {
  deliveryId: string;
  location: LocationData;
  status: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NEXT_PUBLIC_API_URL || '';
    if (!this.baseUrl) {
      console.warn('API URL não configurada no arquivo .env');
    }
  }

  /**
   * Envia a localização do entregador para o backend
   */
  async sendDeliveryLocation(payload: DeliveryLocationPayload): Promise<void> {
    try {
      // Obter token de autenticação se necessário
      const token = await AsyncStorage.getItem('authToken');
      // console.log(`${this.baseUrl}/pusher/transmit`);
      const response = await fetch(`${this.baseUrl}/pusher/transmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar localização: ${response.status}`);
      }

      console.log('✅ Localização enviada para o backend com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar localização para o backend:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();