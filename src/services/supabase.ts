// File: services/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { ClienteBDD } from '../types/types';

// Sustituye estas variables por las de tu proyecto Supabase
export const SUPABASE_URL = 'https://oxffcptgbphyacmybizg.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZmZjcHRnYnBoeWFjbXliaXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTUyNjAsImV4cCI6MjA3NjUzMTI2MH0.N-QbIusAJ1-CI1AS1nnzYjepP51mn7Qa9qUDp085w-I';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Añade un nuevo cliente a la tabla 'Cliente'.
 */
export async function addClienteToSupabase(
  cliente: Omit<ClienteBDD, 'id'>
): Promise<ClienteBDD> {
  const { data, error } = await supabase
    .from('Cliente')
    .insert([cliente])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClienteBDD;
}

/**
 * Obtiene todos los clientes de la tabla 'Cliente'.
 */
export async function getClientesFromSupabase(): Promise<ClienteBDD[]> {
  const { data, error } = await supabase.from('Cliente').select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data as ClienteBDD[];
}

/**
 * Obtiene solo los clientes cuya fecha corresponda al día actual.
 * Utiliza un rango desde la medianoche de hoy hasta la medianoche de mañana.
 */
export async function getClientesHoy(): Promise<ClienteBDD[]> {
  const ahora = new Date();

  // Truncar a medianoche (inicio del día en hora local)
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
  const inicioManiana = new Date(inicioHoy);
  inicioManiana.setDate(inicioHoy.getDate() + 1);

  const { data, error } = await supabase
    .from('Cliente')
    .select('*')
    .gte('fecha', inicioHoy.toISOString())
    .lt('fecha', inicioManiana.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  return data as ClienteBDD[];
}

export async function deleteClienteFromSupabase(id: number): Promise<void> {
  const { error } = await supabase
    .from('Cliente')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getClientesPorFecha(date: Date): Promise<ClienteBDD[]> {
  const yyyy = date.getUTCFullYear();
  const mm = date.getUTCMonth();
  const dd = date.getUTCDate();

  const inicio = new Date(Date.UTC(yyyy, mm, dd, 0, 0, 0));
  const fin = new Date(Date.UTC(yyyy, mm, dd + 1, 0, 0, 0));

  const { data, error } = await supabase
    .from('Cliente')
    .select('*')
    .gte('fecha', inicio.toISOString())
    .lt('fecha', fin.toISOString());

  if (error) throw new Error(error.message);
  return data as ClienteBDD[];
}

export async function updateClienteEstado(
  id: number,
  estado: ClienteBDD['estado']
): Promise<ClienteBDD>  {
  const { data, error } = await supabase
    .from('Cliente')
    .update({ estado })
    .eq('id', id)
    .select()
    .single();;

  if (error) {
    throw new Error(error.message);
  }
  return data as ClienteBDD;
}

export async function updateClienteInSupabase(
  id: number,
  updates: Partial<ClienteBDD>
): Promise<ClienteBDD> {
  const { data, error } = await supabase
    .from('Cliente')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClienteBDD;
}