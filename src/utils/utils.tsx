// utils/optimizarRuta.ts

import { ClienteBDD } from '../types/types';

export function crearCuerpoRouteOptimizationApi(clientes: ClienteBDD[]) {
  const shipments = clientes.map((cliente) => ({
    deliveries: [
      {
        arrivalLocation: {
          latitude: cliente.latitude,
          longitude: cliente.longitude,
        },
        duration: `${parseInt(cliente.estimacion || '10', 10) * 60}s`,
        timeWindows: [
          {
            startTime: getHoraInicio(cliente.disponibilidad),
            endTime: getHoraFin(cliente.disponibilidad),
          }
        ]
      }
    ],
  }));

  const body = {
    model: {
      vehicles: [
        {
          costPerHour: 0,
          costPerKilometer: 0.1,
          startLocation: { latitude: 39.420791, longitude: -0.399811 },
          endLocation: { latitude: 39.467831, longitude: -0.424980 }
        },
      ],
      shipments,
      globalStartTime: new Date().toISOString().split('T')[0] + 'T08:00:00Z',
      globalEndTime: new Date().toISOString().split('T')[0] + 'T18:00:00Z'
    },
    populatePolylines: false,
  };

  return body;
}

function getHoraInicio(disponibilidad: string): string {
  const hoy = new Date().toISOString().split('T')[0];
  switch (disponibilidad) {
    case 'Mañana':
      return `${hoy}T08:00:00Z`;
    case 'Tarde':
      return `${hoy}T12:00:00Z`;
    default:
      return `${hoy}T08:00:00Z`;
  }
}

function getHoraFin(disponibilidad: string): string {
  const hoy = new Date().toISOString().split('T')[0];
  switch (disponibilidad) {
    case 'Mañana':
      return `${hoy}T12:00:00Z`;
    case 'Tarde':
      return `${hoy}T18:00:00Z`;
    default:
      return `${hoy}T18:00:00Z`;
  }
}
export const reconstruirOrdenClientes = (paradasOrdenadas: any, clientesSupabase: ClienteBDD[]) => {
  return paradasOrdenadas
    .map((parada: any) => {
      if (typeof parada.shipmentIndex === 'number') {
        return clientesSupabase[parada.shipmentIndex];
      } else {
        return clientesSupabase[0];
      }
    })
    .filter(Boolean); // elimina los null
};

