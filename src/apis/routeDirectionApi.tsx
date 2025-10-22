import { Linking, Platform } from "react-native";

export async function obtenerRutaDirections(
  coordenadas: { latitude: number; longitude: number }[],
  startLocation: { latitude: number; longitude: number },
  endLocation: { latitude: number; longitude: number }
) {

  const waypoints = [
    startLocation,
    ...coordenadas,
    endLocation
  ]
    .map(c => `${c.longitude},${c.latitude}`)
    .join(";");


  const url = `https://router.project-osrm.org/trip/v1/driving/${waypoints}?source=first&destination=last&roundtrip=false&overview=full`;

  const res = await fetch(url);
  const data = await res.json();

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok") {
      console.error("Error de OSRM:", data);
      return null;
    }

    // Obtener el orden óptimo de los waypoints intermedios
    const orden = data.waypoints.map((wp: { location: any[]; }) => ({
      latitude: wp.location[1],
      longitude: wp.location[0]
    }));

    return orden;
  } catch (error) {
    console.error("Error al obtener ruta OSRM:", error);
    return null;
  }
}

export function abrirGoogleMaps(coordenadas: { latitude: number; longitude: number }[]) {
  if (coordenadas.length < 2) {
    console.warn("Se necesitan al menos dos puntos para abrir ruta");
    return;
  }

  const start = coordenadas[0];
  const end = coordenadas[coordenadas.length - 1];
  const waypoints = coordenadas
    .slice(1, -1) // los intermedios
    .map(c => `${c.latitude},${c.longitude}`)
    .join("|");

  // URL para Google Maps
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?saddr=${start.latitude},${start.longitude}&daddr=${end.latitude},${end.longitude}${waypoints ? "&dirflg=d&waypoints=" + waypoints : ""}`
      : `https://www.google.com/maps/dir/?api=1&origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&travelmode=driving${waypoints ? "&waypoints=" + waypoints : ""}`;

      console.log(url)
  Linking.openURL(url);
}
