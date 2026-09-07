/* ============================================================
   Sesión — entrar con enlace mágico al correo y atar la cuenta
   al número de socio.

   Quién eres no lo decide esta pantalla: lo decide la base de datos.
   Aquí solo se guarda lo que ya se sabe para pintar el menú.
   ============================================================ */
"use strict";

const SESION = {
  sb: null,
  usuario: null,     // usuario de Supabase Auth (o null si es visitante)
  socio: null,       // ficha del socio atada a esa cuenta (o null)
  esAdmin: false,    // pertenece a la junta directiva
  /* Dentro de la junta hay dos niveles. «Presidencia» manda del todo:
     es quien toca la lista de administradores y quien nombra los
     cargos del club. «Gestión» hace todo el trabajo diario —validar,
     censo, cuotas, traspasos— pero no cambia la plataforma. */
  esPresidencia: false,
  rol: "visitante",  // visitante | socio | admin

  /* Mientras esto sea falso todavía no se sabe quién entra: preguntar
     a Supabase lleva su tiempo. Hasta entonces el rol dice «visitante»
     porque hay que decir algo, no porque se haya comprobado. Quien
     mire ese rol antes de tiempo le suelta a un socio de la junta que
     la sección no está abierta a su perfil. */
  resuelta: false,
};

/* Guardamos el token de invitación mientras el usuario va al correo
   y vuelve: el viaje pasa por fuera de la página. */
const LLAVE_INVITACION = "ceppb.invitacion";

SESION.iniciar = async function(sb){
  SESION.sb = sb;

  /* Supabase lee de la dirección la respuesta del correo al conectarse.
     Solo cuando ya la ha leído se puede apartar. */
  const { data } = await sb.auth.getSession();
  SESION.usuario = data.session ? data.session.user : null;
  if (window.limpiarRespuestaDelCorreo) window.limpiarRespuestaDelCorreo();

  /* Al volver del correo, la sesión llega unos instantes después de
     que la página se haya dibujado. Se actualiza en su sitio: recargar
     entero aquí puede dejar al socio dando vueltas. */
  sb.auth.onAuthStateChange(async (_evento, sesion) => {
    const antes = SESION.usuario && SESION.usuario.id;
    SESION.usuario = sesion ? sesion.user : null;
    const ahora = SESION.usuario && SESION.usuario.id;
    if (ahora === antes) return;

    if (SESION.usuario){
      await SESION.reclamarPendiente();
      await SESION.refrescar();
      await recargar();
      SESION.avisarSiFaltaContrasena();
    } else {
      SESION.socio = null; SESION.esAdmin = false;
      SESION.esPresidencia = false; SESION.rol = "visitante";
    }
    SESION.resuelta = true;
    render();
  });

  if (SESION.usuario){
    await SESION.reclamarPendiente();
    await SESION.refrescar();
    SESION.avisarSiFaltaContrasena();
  }
  SESION.resuelta = true;
};

/* Quien entró por el enlace del correo y no tiene contraseña propia se
   encuentra la pantalla para ponerla. Antes esto solo pasaba en el
   instante justo de entrar: si recargaba, se quedaba sin saberlo. */
SESION.avisarSiFaltaContrasena = function(){
  if (!SESION.usuario || SESION.tieneContrasena()) return;
  const r = (location.hash || "").slice(2).split("/")[0];
  if (r === "ajustes") return;
  location.hash = "#/ajustes";
  setTimeout(() => toast("Elige una contraseña para entrar a partir de ahora"), 600);
};

/* Si la tabla `admins` devuelve algo, es que eres de la junta: su
   política de lectura solo deja entrar a la junta. */
SESION.refrescar = async function(){
  if (!SESION.usuario){
    SESION.rol = "visitante"; SESION.esAdmin = false; SESION.esPresidencia = false;
    return;
  }

  /* La tabla de administradores sólo se deja leer a la junta: si
     devuelve algo, es que quien mira es de la junta. Y su propia fila
     dice con qué alcance. */
  const { data: admins } = await SESION.sb.from("admins").select("email,nivel");
  SESION.esAdmin = Array.isArray(admins) && admins.length > 0;
  const correo = String(SESION.usuario.email || "").toLowerCase();
  const mia = (admins || []).find(a => String(a.email).toLowerCase() === correo);
  SESION.esPresidencia = !!(mia && mia.nivel === "presidencia");

  const { data: socio } = await SESION.sb.from("socios")
    .select("*").eq("auth_user_id", SESION.usuario.id).maybeSingle();
  /* deFila() lo deja en el mismo formato que el resto de la aplicación */
  SESION.socio = socio ? deFila(socio, "socios") : null;

  /* Si el correo consta en el censo y esa ficha no tiene dueño, se
     ata sola: es la misma garantía que daba la invitación —que la
     persona controla ese buzón, y el buzón lo puso la secretaría—.
     Cuando hay más de una ficha con el mismo correo, que son las
     familias, no se adivina: se le pregunta cuál es la suya. */
  SESION.fichasPosibles = [];
  if (!SESION.socio){
    const { data: fichas } = await SESION.sb.rpc("fichas_para_mi_correo");
    const l = fichas || [];
    if (l.length === 1){
      const { error } = await SESION.sb.rpc("vincular_a_mi_ficha", { p_socio: l[0].socio_id });
      if (!error){
        const { data: socio } = await SESION.sb.from("socios")
          .select("*").eq("auth_user_id", SESION.usuario.id).maybeSingle();
        SESION.socio = socio ? deFila(socio, "socios") : null;
      }
    } else if (l.length > 1){
      SESION.fichasPosibles = l.map(f => ({
        id: f.socio_id, numero: f.numero, nombre: f.nombre_completo }));
    }
  }

  /* Socio es quien tiene ficha en el censo. Quien entra con un correo
     que no consta no es socio: no ve el libro. */
  SESION.rol = SESION.esAdmin ? "admin" : (SESION.socio ? "socio" : "sin-ficha");

  /* Cada socio ve la plataforma en su idioma, esté donde esté */
  if (typeof ponerIdioma === "function") ponerIdioma(idiomaDe(SESION.socio));
};

/* ---------- entrar ----------

   El día a día es correo y contraseña. El enlace al correo se usa
   dos veces: cuando secretaría invita a un socio por primera vez (y
   ahí es donde elige su contraseña), y cuando alguien la olvida.
   ------------------------------------------------------------ */

SESION.entrarConContrasena = async function(email, contrasena){
  const { error } = await SESION.sb.auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password: contrasena,
  });
  if (error) throw error;
};

/* Enlace al correo: para el alta con invitación y para recuperar */
SESION.pedirEnlace = async function(email){
  const { error } = await SESION.sb.auth.signInWithOtp({
    email: String(email).trim().toLowerCase(),
    options: { emailRedirectTo: location.origin + location.pathname },
  });
  if (error) throw error;
};

/* La contraseña se la pone el socio; nadie más la ve, tampoco la junta.

   Se deja además una marca en la cuenta —no la contraseña, solo el
   hecho de tenerla— porque Supabase no dice si una cuenta la tiene, y
   hace falta saberlo para llevar al socio a ponerla la primera vez. */
SESION.ponerContrasena = async function(contrasena){
  if (!contrasena || contrasena.length < 8)
    throw new Error("La contraseña necesita ocho caracteres como mínimo");
  const { data, error } = await SESION.sb.auth.updateUser({
    password: contrasena,
    data: { tiene_clave: true },
  });
  if (error){
    /* Los mensajes de Supabase vienen en inglés: se traducen los que
       de verdad se encuentra un socio. */
    const m = error.message || "";
    if (/reauthentication|recent/i.test(m))
      throw new Error("Por seguridad hay que volver a entrar antes de cambiar la contraseña. Cierra sesión, entra otra vez con el enlace del correo y vuelve aquí.");
    if (/same as the old|different from the old/i.test(m))
      throw new Error("Esa es la contraseña que ya tenías: elige otra distinta");
    if (/at least|should be/i.test(m))
      throw new Error("La contraseña es demasiado corta: ocho caracteres como mínimo");
    throw new Error(m || "No se ha podido guardar la contraseña");
  }
  if (data && data.user) SESION.usuario = data.user;
};

SESION.tieneContrasena = function(){
  const u = SESION.usuario;
  return !!(u && u.user_metadata && u.user_metadata.tiene_clave);
};

SESION.salir = async function(){
  await SESION.sb.auth.signOut();
  location.hash = "#/muro";
};

/* ---------- invitación ---------- */
SESION.guardarInvitacion = function(token){
  try { localStorage.setItem(LLAVE_INVITACION, token); } catch(e){}
};

/* Al volver del correo, el enlace guardado ata la cuenta al socio.
   La comprobación de que el enlace vale la hace la función
   reclamar_perfil() dentro de la base de datos. */
SESION.reclamarPendiente = async function(){
  let token = null;
  try { token = localStorage.getItem(LLAVE_INVITACION); } catch(e){}
  if (!token) return;

  const { error } = await SESION.sb.rpc("reclamar_perfil", { p_token: token });
  try { localStorage.removeItem(LLAVE_INVITACION); } catch(e){}

  if (error) toast(error.message);
  else toast("Cuenta vinculada a tu ficha de socio");
};

/* ---------- atajos que usan las vistas ---------- */
function miSocioId(){ return SESION.socio ? SESION.socio.id : null; }
function esYo(socioId){ return socioId && socioId === miSocioId(); }
function puedeEditarSocio(id){ return SESION.esAdmin || esYo(id); }
