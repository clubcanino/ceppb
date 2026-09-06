# Especificación funcional

## Qué es

El libro de cría del CEPPB: censo de socios, fichas de ejemplares, pruebas de salud, títulos,
camadas, eventos y cuotas — con el Reglamento de Cría de enero de 2025 aplicado
automáticamente sobre cada ficha.

## Perfiles

| Perfil | Qué puede |
|---|---|
| **Visitante** | Ve los perfiles y ejemplares marcados como públicos, los eventos y el listado oficial de cargos |
| **Socio** | Lo anterior más: su perfil, sus perros, sus fotos, sus cuotas, sus inscripciones, y los perfiles que otros socios hayan abierto a socios |
| **Junta directiva** | Todo. Valida datos, resuelve expedientes, asigna cargos, gestiona cuotas y ve los datos reservados |

## Pantallas

1. **Novedades** — actividad del club: resultados validados, camadas difundibles, aptos concedidos, próximas convocatorias.
2. **Socios** — directorio. Sólo aparece quien lo ha autorizado.
3. **Perfil de socio** — datos que ese socio ha decidido compartir, sus ejemplares y los criados bajo su afijo.
4. **Ejemplares** — buscador con filtros por variedad, sexo, afijo, apto de cría y estado del Anexo A.
5. **Ficha del ejemplar** — pestañas: Resumen · Salud y genética · Aptos de cría · Resultados · Pedigrí · Descendencia · Fotos y vídeos.
6. **Aptos de cría** — matriz de todos los ejemplares contra las cinco figuras, con lo que falta a cada uno.
7. **Simulador de cruce** — comprueba una alianza contra el reglamento antes de solicitarla.
8. **Camadas** — declaración, plazo de comunicación y estado de difusión.
9. **Cruces intervariedades** — expedientes de autorización previa.
10. **Eventos** — convocatorias e inscripciones.
11. **Cargos y jueces** — listados oficiales del club, públicos.
12. **Mi perfil / Cuota y pagos** — área del socio.
13. **Panel de la junta · Validaciones · Invitaciones · Vinculación de altas · Cuotas y cobros · Administradores** — área de la junta.

---

## Motor de reglas del reglamento

### Anexo A — requisitos veterinarios (comunes a las cinco figuras)

| Prueba | Apto |
|---|---|
| Displasia de cadera (HD) | Sólo grados **A** o **B** |
| Displasia de codo (ED) | Sólo grados **0** o **1** |
| Vértebra de transición (LVT) | Sólo ejemplares reconocidos **libres**, diagnóstico del CEPPB |
| CACA, CJM, SDCA1, SDCA2 | **Afectado**: excluido. **Portador**: sólo puede cruzarse con libre |
| ADN de progenitores | Verificado según RSCE |

Diagnósticos válidos: RSCE, o SETOV, AMVAC o AVEPA reconocidas por ella.

### Las cinco figuras de apto de cría (Cap. 2)

| Código | Figura | Edad | Estructura | Carácter / trabajo |
|---|---|---|---|---|
| **ACE** | Apto de Cría de Estructura | 15 m | 2 × MB o superior, una en evento CEPPB | Prueba SIMPLE |
| **ACES** | Estructura Superior | 18 m | 2 × EXC, una en evento CEPPB | Prueba SIMPLE |
| **ACU** | Utilidad | 15 m | 1 × Bueno en evento FCI | Prueba COMPLETA |
| **ACUS** | Utilidad Superior | 20 m | 1 × Bueno en evento FCI | Título IGP3 o MR3 |
| **ACSS** | Gran Seleccionado CEPPB | 20 m | 2 × EXC obtenidas con 18+ meses, una en evento CEPPB | Título IGP3 o MR3 |

Las pruebas de carácter se convalidan a quien ostente FCI-IGP 1 o Mondioring 1 (Cap. 4).

### Baremos de puntuación (Cap. 7)

**Reproductor del Año y Campeón del Club**: MB 3 · EXC 8 · RCAC/RCACIB/RCCPB 10 ·
CAC/CACIB/CCPB/Rappel 12 · Mejor de Raza +2 (sólo Ch. Club) · Test simple 4 · Test completo 6.
La Especial de Cría multiplica ×1,5. Cada sujeto puntúa una sola vez con su mejor resultado.

**Gran Campeón del CEPPB**: Exc 1º 14 · 2º 12 · 3º 11 · 4º 10 · resto de Exc 8 · MB 3 ·
Test simple 4 · Test completo 6. Puntúan todas las pruebas; la Especial de Cría es imprescindible.

**Reproductor Superior**: macho con 4 hijos con apto de cría, hembra con 3, siempre de al
menos dos alianzas distintas. Categoría A si el reproductor tiene apto propio; B si no.

### Edades de monta (Cap. 1.III)

Hembras de 18 meses a 9 años, dejando pasar un celo tras la última camada.
Machos de 15 meses a 12 años.

### Cruces intervariedades (Cap. 8)

Las uniones directas entre variedades están **prohibidas**. Sólo se admiten:

- Malinois × Tervueren fuego (no grises ni deslavados)
- Malinois portador de pelo duro × Laekenois
- Tervueren × Groenendael

Y las tres exigen **autorización previa**: solicitud con escrito motivado, pedigrís,
radiografías, ADN y analíticas; informe de la Comisión de Cría; resolución de la Junta
Directiva en 30 días hábiles. **Sin autorización, la camada no se difunde.**

### Camadas (Cap. 6.1)

Para aparecer en las herramientas de difusión del club hay que comunicarlas **dentro de los
30 días** siguientes al nacimiento, con datos de los progenitores y número y sexo de cachorros.

---

## Reglas de la plataforma

### Validación

Todo lo que introduce un propietario —pruebas de salud, resultados, títulos— entra
**sin validar** y **no computa** para aptos, títulos ni baremos. La junta lo coteja con el
certificado original y lo valida. Si el propietario modifica después un dato de salud, el
expediente vuelve automáticamente a pendiente.

### Privacidad

- El perfil de un socio nace **oculto**. Nadie ve su ficha ni sabe que existe hasta que él lo autoriza.
- Tres niveles: no aparecer · sólo socios · cualquiera.
- Dentro, cada campo tiene su propio nivel.
- **El IBAN no es compartible en ningún nivel**: sólo su titular y la junta.
- Los **cargos del club sí son públicos**, aunque el socio reserve su perfil: de él sólo constan nombre y cargo.

### Titularidad

Cambiarla exige expediente autorizado por la junta. Hasta entonces la ficha sigue a nombre
del titular actual. Cada traspaso queda en el historial del ejemplar.

### Afijo

Pertenece al criador y forma parte del nombre registrado del ejemplar. Al asignar criador,
el afijo se hereda y queda enlazado a su ficha. Editable a mano si el criador no es socio.

### Alta y vinculación

Los 347 socios existen como perfiles sin reclamar. Cada uno recibe una invitación al correo
que consta en secretaría con un **enlace personal de un solo uso**: ese enlace es lo que ata
la cuenta al número de socio. Los 18 sin correo reclaman su perfil a mano con nº de socio,
DNI y teléfono, y la secretaría lo aprueba.
