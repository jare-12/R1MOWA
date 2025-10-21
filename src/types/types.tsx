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
};

export type Geolocation = {
  latitude: number;
  longitude: number;
};