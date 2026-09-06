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
  rol: "visitante",  // visitante | socio | admin
};

/* Guardamos el token de invitación mientras el usuario va al correo
   y vuelve: el viaje pasa por fuera de la página. */
const LLAVE_INVITACION = "ceppb.invitacion";

SESION.iniciar = async function(sb){
  SESION.sb = sb;

  const { data } = await sb.auth.getSession();
  SESION.usuario = data.session ? data.session.user : null;

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
    } else {
      SESION.socio = null; SESION.esAdmin = false; SESION.rol = "visitante";
    }
    render();
  });

  if (SESION.usuario){
    await SESION.reclamarPendiente();
    await SESION.refrescar();
  }
};

/* Si la tabla `admins` devuelve algo, es que eres de la junta: su
   política de lectura solo deja entrar a la junta. */
SESION.refrescar = async function(){
  if (!SESION.usuario){ SESION.rol = "visitante"; return; }

  const { data: admins } = await SESION.sb.from("admins").select("email").limit(1);
  SESION.esAdmin = Array.isArray(admins) && admins.length > 0;

  const { data: socio } = await SESION.sb.from("socios")
    .select("*").eq("auth_user_id", SESION.usuario.id).maybeSingle();
  /* deFila() lo deja en el mismo formato que el resto de la aplicación */
  SESION.socio = socio ? deFila(socio, "socios") : null;

  SESION.rol = SESION.esAdmin ? "admin" : "socio";
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

/* La contraseña se la pone el socio; nadie más la ve, tampoco la junta */
SESION.ponerContrasena = async function(contrasena){
  if (!contrasena || contrasena.length < 8)
    throw new Error("La contraseña necesita ocho caracteres como mínimo");
  const { error } = await SESION.sb.auth.updateUser({ password: contrasena });
  if (error) throw error;
};

/* ¿Tiene ya contraseña puesta, o entró solo por el enlace? */
SESION.tieneContrasena = function(){
  const u = SESION.usuario;
  if (!u) return false;
  const ident = u.identities || [];
  return ident.some(i => i.provider === "email") && !!u.confirmed_at;
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
