import { LocationAddress } from "./types";

export class LocationsConstants {
  static readonly START_LOCATION: LocationAddress = {
    latitude: 39.467128271693085,
    longitude: -0.42699651572677905,
    nameAddress: "Avinguda del Camí Nou", // ejemplo de calle
  };

  static readonly END_LOCATION: LocationAddress = {
    latitude: 39.46643518465111,
    longitude: -0.38719235731378177,
    nameAddress: "Carrer de Sant Josep de Calassanç", // ejemplo de calle
  };
}

export const Colors = {
  primary: '#5C4033',   // Marrón café oscuro
  secondary: '#7B3F00', // Marrón chocolate
  light: '#D2B48C',     // Beige cálido
  accent: '#C9A66B',    // Arena suave
  danger: '#B22222',   // Rojo fuego oscuro para botón de eliminar
};