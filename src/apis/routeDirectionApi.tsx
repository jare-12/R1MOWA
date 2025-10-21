
import polyline from '@mapbox/polyline';
import { Geolocation } from '../types/types';

const GOOGLE_API_KEY = 'AIzaSyDdCKdK6l0nBXRrWk9Pny0zZ-Edl4ilo58';

export async function obtenerRutaGoogleDirections(coordenadas: { latitude: number, longitude: number }[], startLocation: Geolocation, endLocation: Geolocation) {

  const waypoints = coordenadas
    .map(coord => `${coord.latitude},${coord.longitude}`)
    .join('|');

  const origin = `${startLocation.latitude},${startLocation.longitude}`;
  const destination = `${endLocation.latitude},${endLocation.longitude}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&mode=driving&key=${GOOGLE_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Directions API Error: ${data.status}`);
  }

  const route = data.routes[0];
  const decodedPoints = polyline.decode(route.overview_polyline.points);
  const rutaDecodificada: Geolocation[] = decodedPoints.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));

  return {
    rutaDecodificada,
    waypoints: coordenadas,
  };
}
