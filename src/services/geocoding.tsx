export const geocodearDireccion = async (
  fullAddress: string
): Promise<{ latitude: number; longitude: number }> => {
  // Nominatim OpenStreetMap API
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    fullAddress
  )}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error("No se pudo geocodificar la dirección: " + fullAddress);
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
};
