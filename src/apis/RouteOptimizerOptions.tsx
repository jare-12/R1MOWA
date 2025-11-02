import { ClienteBDD, Geolocation } from "../types/types";

type ClienteIdx = { idx: number; disponibilidad: 'Mañana' | 'Tarde' | 'NC'; cliente: ClienteBDD };

export interface RouteOptimizerOptions {
  osrmBaseUrl?: string; // por defecto usa el público
  penaltyK?: number;    // peso de la penalización (mayor => respeta más las disponibilidades)
  twoOptMaxIter?: number;
  debug?: boolean;
}

export class RouteOptimizer {
  private osrmBaseUrl: string;
  private penaltyK: number;
  private twoOptMaxIter: number;
  private debug: boolean;

  constructor(opts?: RouteOptimizerOptions) {
    this.osrmBaseUrl = opts?.osrmBaseUrl ?? 'https://router.project-osrm.org';
    this.penaltyK = opts?.penaltyK ?? 1200; // ajustable: mayor valor => más fuerza para respetar Mañana/Tarde
    this.twoOptMaxIter = opts?.twoOptMaxIter ?? 300;
    this.debug = opts?.debug ?? false;
  }

  // ---------------------------------------------------
  // API pública: recibe clientes desordenados + start/end -> devuelve clientes con .order
  // ---------------------------------------------------
  public async optimize(
    clientesInput: ClienteBDD[],
    startLocation: Geolocation,
    endLocation: Geolocation
  ): Promise<ClienteBDD[]> {
    if (!Array.isArray(clientesInput)) throw new Error('clientesInput must be an array');

    // 1) Construir coords: start, clientes..., end
    const coords = [
      `${startLocation.longitude},${startLocation.latitude}`,
      ...clientesInput.map(c => `${c.longitude},${c.latitude}`),
      `${endLocation.longitude},${endLocation.latitude}`
    ];

    const startIdx = 0;
    const endIdx = coords.length - 1;
    const totalClients = clientesInput.length;

    // Mapear clientes a idx en la matriz OSRM
    const clientesIdx: ClienteIdx[] = clientesInput.map((c, i) => ({
      idx: i + 1, // porque 0 es start
      disponibilidad: c.disponibilidad,
      cliente: c
    }));
    // 2) Obtener matrix de duraciones (segundos)
    const durations = await this.fetchDurations(coords);
    // 3) Heurística: greedy con penalizaciones para turnos
    const initialRoute = this.greedyRouteWithPenalties(startIdx, endIdx, clientesIdx, durations, totalClients);
    
    // 4) Mejora local: 2-opt que respeta start/end como fijos
    const clientesByIdx = new Map(clientesIdx.map(c => [c.idx, c]));
    const improved = this.twoOptImprove(initialRoute, clientesByIdx, durations, this.twoOptMaxIter);

    if (this.debug) {
      console.log('initialRoute', initialRoute);
      console.log('improvedRoute', improved);
    }

    // 5) Mapear la secuencia a clientes y rellenar order (1..N según aparición)
    // improved incluye start y end; recorremos y asignamos order a clientes
    const resultClients = clientesInput.map(c => ({ ...c, order: undefined } as ClienteBDD));
    let orderCounter = 1;
    for (let i = 1; i < improved.length - 1; i++) {
      const idx = improved[i]; // índice en coords (1..N)
      const clienteIdx = clientesByIdx.get(idx);
      if (clienteIdx) {
        // localizar el cliente original y asignar order
        const original = clienteIdx.cliente;
        // encontrar referencia en resultClients por id o por lat/lon si id no existe
        const match = resultClients.find(rc =>
          (rc.id !== undefined && original.id !== undefined && rc.id === original.id) ||
          (rc.latitude === original.latitude && rc.longitude === original.longitude && rc.nombre === original.nombre)
        );
        if (match) {
          match.order = orderCounter++;
        }
      }
    }

    // Devolver lista ordenada por order ascendente (si algún cliente quedó sin order, los pone al final)
    return resultClients.sort((a, b) => {
      const oa = a.order ?? 999999;
      const ob = b.order ?? 999999;
      return oa - ob;
    });
  }

  // ---------------------------------------------------
  // Helpers: OSRM Table fetch
  // ---------------------------------------------------
  private async fetchDurations(coords: string[]): Promise<number[][]> {
    const coordsStr = coords.join(';');
    const url = `${this.osrmBaseUrl}/table/v1/driving/${coordsStr}?annotations=duration`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OSRM Table API error: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    
    // json.durations es number[][] con duraciones en segundos. Puede contener null si no hay ruta.
    const raw: (number | null)[][] = json.durations;
    if (!raw || !Array.isArray(raw)) {
      throw new Error('Invalid OSRM table response (no durations)');
    }
    // Convertir null => gran número (infinito práctico)
    const INF = 1e9;
    const durations: number[][] = raw.map(row => row.map(v => (v === null || v === undefined ? INF : v)));
    return durations;
  }

  // ---------------------------------------------------
  // Penalización por posición según disponibilidad
  // pos: 0..(totalClients-1)
  // totalClients: número total de clientes (sin start/end)
  // ---------------------------------------------------
  private penaltyForPosition(disponibilidad: 'Mañana' | 'Tarde' | 'NC', pos: number, totalClients: number): number {
    if (disponibilidad === 'NC') return 0;
    // normalizamos t en [0..1] (0 inicio, 1 final)
    const denom = Math.max(1, totalClients - 1);
    const t = pos / denom;
    if (disponibilidad === 'Mañana') {
      // penaliza aparecer tarde -> penalización aumenta con t
      return this.penaltyK * t;
    }
    // 'Tarde' -> penaliza aparecer pronto -> penalización alta cuando t cercano a 0
    return this.penaltyK * (1 - t);
  }

  // ---------------------------------------------------
  // Greedy construction: desde start, insertamos siguiente minimizando travel + penalty
  // ---------------------------------------------------
  private greedyRouteWithPenalties(
    startIdx: number,
    endIdx: number,
    clientes: ClienteIdx[],
    durations: number[][],
    totalClients: number
  ): number[] {
    const remaining = new Set(clientes.map(c => c.idx));
    const route: number[] = [startIdx];
    while (remaining.size > 0) {
      const current = route[route.length - 1];
      let best: { idx: number; score: number } | null = null;
      const posIfChosen = route.length - 1; // posición en clientes (0..)

      for (const idx of Array.from(remaining)) {
        const travel = durations[current]?.[idx] ?? 1e9;
        // calc pos candidate = posIfChosen (siguiente posición entre clientes)
        const pos = posIfChosen;
        const cliente = clientes.find(c => c.idx === idx)!;
        const pen = this.penaltyForPosition(cliente.disponibilidad, pos, totalClients);
        const score = travel + pen;
        if (!best || score < best.score) best = { idx, score };
      }

      if (!best) break;
      route.push(best.idx);
      remaining.delete(best.idx);
    }

    route.push(endIdx);
    return route;
  }

  // ---------------------------------------------------
  // Cost function: sum(durations) + sum(penalizaciones por posición)
  // route: array de índices con start y end incluidos
  // clientesByIdx: map idx -> ClienteIdx (start/end no estarán)
  // ---------------------------------------------------
  private routeCostWithPenalties(route: number[], clientesByIdx: Map<number, ClienteIdx>, durations: number[][]): number {
    let cost = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i], b = route[i + 1];
      cost += durations[a]?.[b] ?? 1e9;
    }
    // añadir penalizaciones (solo para posiciones que correspondan a clientes)
    const totalClients = Math.max(0, route.length - 2);
    for (let i = 1; i < route.length - 1; i++) {
      const idx = route[i];
      const cliente = clientesByIdx.get(idx);
      if (cliente) {
        const pos = i - 1; // 0..totalClients-1
        cost += this.penaltyForPosition(cliente.disponibilidad, pos, totalClients);
      }
    }
    return cost;
  }

  // ---------------------------------------------------
  // 2-opt: mejora local (no toca start(0) ni end(last))
  // ---------------------------------------------------
  private twoOptImprove(
    route: number[],
    clientesByIdx: Map<number, ClienteIdx>,
    durations: number[][],
    maxIter = 200
  ): number[] {
    let bestRoute = route.slice();
    let bestCost = this.routeCostWithPenalties(bestRoute, clientesByIdx, durations);
    let improved = true;
    let iter = 0;

    while (improved && iter++ < maxIter) {
      improved = false;
      const n = bestRoute.length;
      // i..j define el segmento que vamos a invertir (no tocamos 0 ni n-1)
      for (let i = 1; i < n - 2; i++) {
        for (let j = i + 1; j < n - 1; j++) {
          // generar nueva ruta con segmento i..j invertido
          const newRoute = bestRoute.slice();
          newRoute.splice(i, j - i + 1, ...bestRoute.slice(i, j + 1).reverse());
          const c = this.routeCostWithPenalties(newRoute, clientesByIdx, durations);
          if (c + 1e-9 < bestCost) { // margen numérico
            bestCost = c;
            bestRoute = newRoute;
            improved = true;
            if (this.debug) {
              console.log(`2-opt improvement iter=${iter} i=${i} j=${j} cost=${bestCost}`);
            }
          }
        }
      }
    }

    return bestRoute;
  }
}
