// Build para la app NATIVA (Android/iOS empaquetada, ej. para probar en
// BlueStacks/emulador/celular). La app nativa no tiene el proxy de
// `ionic serve` (proxy.conf.json), así que "/api" relativo no llega a
// ningún lado — hace falta una URL absoluta al backend.
//
// OJO: esta IP es la de la PC donde corre `php artisan serve` en la red
// local (`ipconfig` → IPv4 del adaptador de verdad, no el 192.168.56.1 de
// VirtualBox). Cambia según la máquina/red de quien esté probando — no es
// un valor fijo de producción. El backend tiene que levantarse con
// `--host=0.0.0.0` para aceptar conexiones que no sean de 127.0.0.1.
export const environment = {
  production: false,
  apiBaseUrl: 'http://192.168.101.11:8000/api',
};
