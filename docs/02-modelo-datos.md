# Modelo de datos

El esquema completo, con tipos y políticas, está en `db/schema.sql`. Aquí va el mapa.

## Entidades

**socios** — censo. Identidad, contacto, ficha cinológica (RSCE, afijo, disciplinas,
variedades, grupo de trabajo), cargos del club, consentimiento de visibilidad y privacidad
por campo. `auth_user_id` ata la cuenta de acceso al socio.

**socios_privado** — DNI, dirección e IBAN. Tabla aparte por diseño: así los datos reservados
nunca viajan con el perfil aunque una consulta se escriba mal.

**perros** — identificación (nombre, afijo, variedad, sexo, LOE, chip, tatuaje), vínculos
(propietario, criador, padre, madre), `salud` en JSON con el Anexo A, estado de validación,
visibilidad e historial de titularidad.

**resultados** — un certificado por fila. Estructura, carácter, trabajo o confirmación, con
su estado de validación.

**camadas** — progenitores, fechas, número y sexo de cachorros, LOE de camada, comunicación
y difusión.

**solicitudes** — los dos expedientes que resuelve la junta: cruce intervariedades y cambio
de titularidad.

**eventos**, **inscripciones**, **pagos**, **media**, **invitaciones**, **admins**.

## Lo que hace cumplir la base de datos

| Regla | Mecanismo |
|---|---|
| Los cargos sólo los asigna la junta | trigger `proteger_socio` |
| El número de socio y los datos de secretaría, sólo la junta | trigger `proteger_socio` |
| La validación de salud sólo la firma la junta | trigger `proteger_validacion_salud` |
| Tocar la salud devuelve el expediente a pendiente | mismo trigger |
| La titularidad no se cambia a mano | mismo trigger |
| Los resultados nacen sin validar | trigger `proteger_validacion_resultado` |
| Sólo la junta resuelve expedientes | trigger `resolver_solicitud` |
| El traspaso autorizado se aplica solo | mismo trigger |
| Camada intervariedades sin autorización no se difunde | trigger `comprobar_difusion_camada` |
| Perfil oculto es invisible de verdad | política `socios_lectura` |
| Los cargos son públicos aunque el perfil no lo sea | misma política |
| El IBAN, sólo titular y junta | políticas de `socios_privado` |
| El enlace de invitación ata la cuenta al socio | función `reclamar_perfil` |
