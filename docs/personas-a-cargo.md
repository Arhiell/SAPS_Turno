# Gestión de turnos de personas a cargo

Un usuario con rol PACIENTE puede reservar para sí mismo y para los pacientes vinculados a su identidad como tutor. Se reutilizan `personas`, `pacientes`, `tutores` y `paciente_tutores`; no se necesitan tablas nuevas.

## Registro

1. Administración registra al paciente que recibirá la atención, con su DNI y cobertura propios. El menor o adulto a cargo no necesita una cuenta para recibir un turno.
2. El responsable debe tener su propia ficha y una cuenta de paciente activa.
3. En **Pacientes → detalle → Tutores y responsables**, el personal autorizado ingresa el DNI del responsable, el vínculo y confirma que verificó la autorización. La gestión se limita a los pacientes de sus salitas.
4. El responsable ingresa a **Personas a cargo** y selecciona **Solicitar turno** o **Ver turnos**. También puede cambiar de paciente desde esas pantallas.
5. Administración puede retirar o restituir el permiso desde la misma ficha. La revocación impide nuevas consultas y operaciones aunque el usuario conserve un enlace anterior.

## Reglas

- El límite existente es un turno abierto **por paciente y especialidad**, no por cuenta ni por grupo familiar. Dos hijos pueden reservar pediatría, cada uno en un horario disponible distinto del mismo profesional.
- La disponibilidad, cobertura, sanciones y superposición de horarios se validan para quien recibe la atención.
- El turno pertenece al paciente atendido; `creado_por` conserva el usuario que lo solicitó. No se duplican las fichas ni se trasladan los turnos al tutor.
- Solo habilitan el acceso los tutores activos con permiso y vínculo vigente. Para reservar, la autorización también debe cubrir el día del turno.
- Se reutilizan la consulta de historial y la cancelación del paciente. La reprogramación continúa a cargo del personal autorizado.
- Los avisos internos de creación, cambios y cancelación se envían también a responsables autorizados. El correo conserva el destinatario del paciente configurado previamente.
- El parentesco no habilita permisos por sí solo. No se permite asociarse a un paciente únicamente conociendo su DNI desde una cuenta de paciente.

No se ejecutaron pruebas automatizadas ni compilaciones durante este cambio, por indicación del solicitante.
