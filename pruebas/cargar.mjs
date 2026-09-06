/* Carga los archivos del navegador en un contexto de Node para poder
   probarlos sin abrir Chrome.

   Los `const` de un script no aparecen en el objeto global, así que
   después de cargar se evalúa una expresión para sacarlos. */
import { readFileSync } from "node:fs";
import vm from "node:vm";

export function cargar(archivos, nombres){
  const ctx = vm.createContext({ console, window: {} });
  for (const f of archivos){
    vm.runInContext(readFileSync(new URL("../" + f, import.meta.url), "utf8"), ctx, { filename: f });
  }
  return vm.runInContext("({" + nombres.join(",") + "})", ctx);
}
