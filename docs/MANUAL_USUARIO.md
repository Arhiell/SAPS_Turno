# 👥 Manual funcional por rol

[Índice](README.md) · [Autogestión detallada](PACIENTE_AUTOGESTION.md)

## Acceso común

1. Abrir la aplicación y acceder con el mecanismo habilitado para la cuenta.
2. Completar verificaciones y perfil cuando la aplicación lo solicite.
3. Utilizar las opciones correspondientes al rol. La presencia de un enlace no reemplaza la autorización de la API.
4. Consultar notificaciones y cerrar sesión al terminar en un dispositivo compartido.

La información pública incluye salitas, noticias y orientación del asistente. El asistente no realiza diagnósticos ni modifica reservas.

## Paciente

Completar identidad, contacto y barrio permite determinar cobertura. La salita disponible depende de asociaciones territoriales activas y vigentes. Si hay varias opciones y falta una asignación válida, no se debe asumir una selección automática arbitraria.

Para reservar: seleccionar a quién se atenderá, especialidad, profesional y bloque disponible; revisar y confirmar. La operación solo está completa cuando el servidor confirma la reserva. Si el bloque dejó de estar disponible, actualizar la consulta y elegir otro.

En mis turnos se consultan reservas y acciones permitidas. Una sanción pertenece al paciente atendido. Las personas a cargo requieren una vinculación aprobada y permisos de gestión; una solicitud pendiente no habilita reservas en su nombre. Véase [personas a cargo](personas-a-cargo.md).

## Profesional

Consultar agenda propia, revisar datos necesarios para la atención y registrar el resultado según las acciones habilitadas. Marcar una inasistencia tiene efectos sobre futuras reservas del paciente. Revisar la agenda después de avisos de cambios; el evento en tiempo real es una señal para actualizar datos.

La consulta y exportación de agenda diaria respetan la identidad profesional del usuario. El rol no concede administración general de salitas.

## Administrador de salita

Administrar recursos, pacientes, agenda, comunicaciones y reportes dentro de las salitas asignadas. Antes de modificar un horario o registrar una ausencia/cierre, revisar los turnos afectados, proponer alternativas y resolver cada resultado. No interpretar una propuesta como reserva garantizada.

Revisar solicitudes de vinculación conforme al procedimiento institucional. La aplicación registra la autorización; el flujo actual no constituye un repositorio de documentos adjuntos.

## Superadministrador

Gestionar alcance global, cuentas y asignaciones, catálogos, configuración, contenido público y calendario institucional. Utilizar el dashboard para indicadores generales y reportes para consultas filtradas. La sincronización manual del calendario está reservada a este rol.

## Recepción

El backend contempla el rol `RECEPCION` con operaciones expresamente autorizadas y alcance por asignaciones. En la interfaz, el acceso está limitado a **Configuración → Bloqueos** (`/configuracion/bloqueos`); no dispone de un panel general ni de las demás pantallas administrativas. La disponibilidad de operaciones adicionales en la API no equivale a una interfaz completa.

## Incidencias habituales

| Situación | Acción |
| --- | --- |
| No aparecen horarios | Revisar fecha, cobertura, especialidad, vigencias, cierres y ocupación |
| Conflicto al confirmar | Actualizar disponibilidad; otra escritura pudo ocupar el bloque |
| Cambio rechazado por versión | Recargar el turno y revisar el cambio más reciente |
| Vinculación sin acceso | Comprobar aprobación, vigencia y permisos de la relación |
| Correo no recibido | Revisar dirección y bandeja; administración puede inspeccionar estado de envío |
| Sesión vencida | Volver a iniciar sesión si la renovación no permite continuar |

No compartir contraseñas ni incluir información clínica o credenciales en reportes de incidencias.
