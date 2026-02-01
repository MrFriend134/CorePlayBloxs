/**
 * Ejecuta código Lua en el navegador usando fengari.
 * Captura print() y errores para la consola del editor.
 */
let fengari = null;

async function loadFengari() {
  if (fengari) return fengari;
  try {
    const m = await import('fengari');
    fengari = m.default || m;
    return fengari;
  } catch (e) {
    console.warn('fengari no disponible:', e);
    return null;
  }
}

function stackToJsString(L, lua, idx) {
  if (!L || !lua) return '';
  const str = lua.lua_tolstring(L, idx, null);
  if (!str) return '';
  if (fengari.to_jsstring) return fengari.to_jsstring(str);
  if (typeof str === 'string') return str;
  try {
    return new TextDecoder('utf-8').decode(str);
  } catch {
    return String(str);
  }
}

export async function runLua(code, onPrint) {
  const lib = await loadFengari();
  if (!lib) return { ok: false, output: [], error: 'Lua (fengari) no está instalado. Ejecuta: npm install fengari en client.' };

  const lauxlib = lib.lauxlib;
  const lualib = lib.lualib;
  const lua = lib.lua;
  const to_luastring = lib.to_luastring;

  if (!lauxlib || !lualib || !lua) {
    return { ok: false, output: [], error: 'API fengari incompleta.' };
  }

  const L = lauxlib.luaL_newstate();
  if (!L) return { ok: false, output: [], error: 'No se pudo crear el estado Lua.' };

  lualib.luaL_openlibs(L);
  const output = [];

  const printFunc = () => {
    const n = lua.lua_gettop(L);
    const parts = [];
    for (let i = 1; i <= n; i++) {
      parts.push(stackToJsString(L, lua, i));
    }
    lua.lua_settop(L, 0);
    const line = parts.join('\t');
    output.push(line);
    if (onPrint) onPrint(line);
    return 0;
  };

  lua.lua_pushjsfunction(L, printFunc);
  lua.lua_setglobal(L, to_luastring ? to_luastring('print') : 'print');

  const codeBytes = to_luastring ? to_luastring(code) : code;
  const loadResult = lauxlib.luaL_loadstring(L, codeBytes);
  if (loadResult !== lua.LUA_OK) {
    const err = stackToJsString(L, lua, -1);
    lua.lua_settop(L, 0);
    return { ok: false, output, error: err || 'Error de sintaxis.' };
  }

  const callResult = lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0);
  if (callResult !== lua.LUA_OK) {
    const err = stackToJsString(L, lua, -1);
    lua.lua_settop(L, 0);
    return { ok: false, output, error: err || 'Error en tiempo de ejecución.' };
  }

  lua.lua_settop(L, 0);
  return { ok: true, output, error: null };
}

export function isLuaAvailable() {
  return !!fengari;
}
