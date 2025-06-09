import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { apiService } from '../api/apiService';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private isTracking: boolean = false;
  private currentLocation: LocationData | null = null;
  private deliveryId: string | null = null;

  constructor() {}

  async initialize() {
    try {
      this.deliveryId = await AsyncStorage.getItem('deliveryId');
    } catch (error) {
      console.error('Erro ao recuperar deliveryId:', error);
    }
  }

  async setDeliveryId(id: string) {
    this.deliveryId = id;
    await AsyncStorage.setItem('deliveryId', id);
  }

  // Inicia o tracking de localização
  async startLocationTracking(): Promise<void> {
    if (this.isTracking) {
      console.log('Location tracking já está ativo');
      return;
    }

    try {
      // Solicita permissão de localização
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Permissão de localização negada');
      }

      this.isTracking = true;

      // Inicia o watch da localização
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Atualiza a cada 10 metros
          timeInterval: 5000, // Intervalo de 5 segundos
        },
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          };
        }
      );

      // Inicia o envio periódico via API
      this.startPeriodicLocationSend();

      console.log('Location tracking iniciado');
    } catch (error) {
      console.error('Erro ao iniciar location tracking:', error);
      this.isTracking = false;
    }
  }

  // Método waitForPusherConnection removido pois não é mais necessário

  // Para o tracking de localização
  stopLocationTracking(): void {
    if (!this.isTracking) {
      return;
    }

    // Para o watch da localização
    if (this.watchId !== null) {
      this.watchId.remove();
      this.watchId = null;
    }

    // Para o envio periódico
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isTracking = false;
    this.currentLocation = null;
    
    console.log('Location tracking parado');
  }

  // Envia localização via API a cada 10 segundos
  private startPeriodicLocationSend(): void {
    this.intervalId = setInterval(async () => {
      if (this.currentLocation && this.deliveryId) {
        try {
          // pois estamos usando API direta
          await this.sendLocationToApi(this.currentLocation);
        } catch (error) {
          console.error('Erro ao enviar localização:', error);
        }
      } else {
        console.warn('Localização ou deliveryId não disponível');
      }
    }, 10000); // 10 segundos
  }

  // Envia localização via API
  private async sendLocationToApi(location: LocationData): Promise<void> {
    if (!this.deliveryId) {
      console.warn('DeliveryId não configurado');
      return;
    }

    // const locationPayload = {
    //   deliveryId: this.deliveryId,
    //   location: location,
    //   status: 'em_rota',
    // };
    const locationPayload = {
      channel:'private-delivery-realtime',
      event:'update_localization',
      data:[location]
    };

    

    try {
      // Enviar localização para o backend via API
      await apiService.sendDeliveryLocation(locationPayload as any);
      console.log('✅ Localização enviada:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        timestamp: new Date(location.timestamp).toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao enviar localização via API:', error);
    }
  }

  // Obtém localização atual (uma vez)
  async getCurrentLocation(): Promise<LocationData> {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });
      const location: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      };
      return location;
    } catch (error) {
      console.error('Erro ao obter localização atual:', error);
      throw error;
    }
  }

  // Solicita permissão de localização
  private async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permissão de localização negada');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }

  // Getters
  get isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  get lastKnownLocation(): LocationData | null {
    return this.currentLocation;
  }
}

export const locationService = new LocationService();