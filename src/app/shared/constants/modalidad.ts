/**
 * Modalidad de un pedido y su etiqueta para mostrar en la UI.
 * "Comer aquí" era ambiguo (podía leerse como "en mi casa"): usamos
 * "Comer en el restaurante". Usado tanto en la app cliente como en el admin.
 */
export type Modalidad = 'para_llevar' | 'comer_aqui';

export const MODALIDAD_LABEL: Record<Modalidad, string> = {
  para_llevar: 'Para llevar',
  comer_aqui: 'Comer en el restaurante',
};
