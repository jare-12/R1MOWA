// hooks/useUserLocation.tsx

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import { Region } from 'react-native-maps';

export interface Geolocation {
  latitude: number;
  longitude: number;
}

interface UseUserLocationResult {
  userLocation: Geolocation | null;
  region: Region;
}

export function useUserLocation(
  initialRegion: Region
): UseUserLocationResult {
  const [userLocation, setUserLocation] = useState<Geolocation | null>(null);
  const [region, setRegion] = useState<Region>(initialRegion);

  useEffect(() => {
    let watchSubscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación.');
        return;
      }

      // Ubicación inicial
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude: latInit, longitude: lngInit } = loc.coords;
      setUserLocation({ latitude: latInit, longitude: lngInit });
      setRegion((prev) => ({
        latitude: latInit,
        longitude: lngInit,
        latitudeDelta: prev.latitudeDelta,
        longitudeDelta: prev.longitudeDelta,
      }));

      // Escuchar cambios
      watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });
        }
      );
    })();

    return () => {
      if (watchSubscription) watchSubscription.remove();
    };
  }, []);

  return { userLocation, region };
}
