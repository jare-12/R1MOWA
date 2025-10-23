export type ClienteBDD = {
  id?: number; 
  nombre: string;
  numero_telefono: string;
  direccion: string;
  direccion_extra: string;
  producto?: string;
  estado: 'Pendiente' | 'Entregado' | 'Instalado' | 'Ausente';
  disponibilidad: 'Mañana' | 'Tarde' | 'NC';
  hora?: Date;
  estimacion?: string;
  latitud: number;
  longitud: number;
  fecha: Date;
  order: number | undefined
};

export type Geolocation = {
  latitude: number;
  longitude: number;
};

export type LocationAddress = {
  latitude: number;
  longitude: number;
  nameAddress: string; 
};

export type Waypoint = {
  distance: number;
  location: [number, number]; 
  name: string;
  waypoint_index: number;
}