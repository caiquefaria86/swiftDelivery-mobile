import React, { useEffect } from 'react';
import { Button, Text, View } from 'react-native';
import { useLocation } from '../../hooks/useLocation';

export const MapScreen = () => {
  const { isTracking, currentLocation, error, startTracking, stopTracking } = useLocation();

  useEffect(() => {
    // Inicia tracking automaticamente quando a tela é carregada
    startTracking('delivery-123');
    
    // Cleanup quando sair da tela
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Status: {isTracking ? 'Tracking Ativo' : 'Tracking Inativo'}</Text>
      
      {currentLocation && (
        <Text>
          Localização: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
        </Text>
      )}
      
      {error && <Text style={{ color: 'red' }}>Erro: {error}</Text>}
      
      <Button
        title={isTracking ? "Parar Tracking" : "Iniciar Tracking"}
        onPress={() => isTracking ? stopTracking() : startTracking('delivery-123')}
      />
    </View>
  );
};