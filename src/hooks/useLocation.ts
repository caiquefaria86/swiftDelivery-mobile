import { useEffect, useState } from 'react';
import { LocationData, locationService } from '../services/location/locationService';

export const useLocation = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLocationService = async () => {
      await locationService.initialize();
    };
    initLocationService();

    // Cleanup quando o componente for desmontado
    return () => {
      if (locationService.isCurrentlyTracking) {
        locationService.stopLocationTracking();
      }
    };
  }, []);

  const startTracking = async (deliveryId: string) => {
    try {
      setError(null);
      await locationService.setDeliveryId(deliveryId);
      await locationService.startLocationTracking();
      setIsTracking(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar tracking');
    }
  };

  const stopTracking = () => {
    locationService.stopLocationTracking();
    setIsTracking(false);
    setCurrentLocation(null);
  };

  const getCurrentLocation = async () => {
    try {
      setError(null);
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      return location;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter localização');
      throw err;
    }
  };

  return {
    isTracking,
    currentLocation,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };
};