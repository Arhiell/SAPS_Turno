# Autenticación SAPS Turno

## Configuración local

- Frontend: `VITE_API_URL` (por defecto `http://localhost:3000/api`) y `VITE_GOOGLE_CLIENT_ID` en `frontend/.env.local`.
- Backend: conservar las variables JWT, Supabase, Google y SMTP existentes. `FRONTEND_URL` define el destino de los enlaces de correo y vale `http://localhost:5173` por defecto.
- El Client ID de Google debe coincidir en ambos lados. El origen del frontend debe estar autorizado en la consola de Google. Referencia: [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/display-button).
- Los archivos `.env` están excluidos del repositorio. No agregar credenciales reales a este documento ni a código fuente.

## Flujos implementados

- `/login`: login normal para los roles del sistema, mostrando errores de la API y evitando envíos repetidos.
- `/registro`: crea exclusivamente una cuenta PACIENTE. El backend genera el nombre de usuario y envía la verificación. Después de verificar el correo, el paciente inicia sesión y completa su perfil.
- Google reutiliza `/api/auth/google`: crea pacientes nuevos o inicia sesión en una identidad existente. Para vincular una cuenta local preexistente se exige que sea PACIENTE, esté activa y tenga correo verificado.
- `/completar-perfil`: usa la identidad autenticada y su correo, sin aceptar un usuario ni un email elegidos por el cliente. Rechaza DNI o email asociados a otra persona. La vinculación de una ficha preexistente requiere intervención administrativa; no se duplica ni se reclama automáticamente por DNI.
- `/recuperar-contrasena` y `/restablecer-contrasena?token=…`: reutilizan la recuperación existente y el envío SMTP. La solicitud devuelve un mensaje genérico y no devuelve el token al cliente.
- `/verificar-email?token=…`: confirma el correo. Sin token permite solicitar otro enlace.
- `/administracion`: SUPER_ADMIN crea administradores; SUPER_ADMIN y ADMIN_SALITA crean cuentas para profesionales ya registrados y autorizados. Las cuentas se vinculan a `usuarios.id_persona`.

## Acceso

| Rol | Destino y alcance |
| --- | --- |
| SUPER_ADMIN | Dashboard administrativo existente y módulos administrativos. |
| ADMIN_SALITA | Dashboard existente. Pacientes, profesionales, turnos, agenda y reportes restringidos a sus salitas en los endpoints modificados. |
| PROFESIONAL | `/mi-agenda` y `/mis-pacientes`. Turnos propios, estados ATENDIDO/NO_ASISTIO y agenda diaria PDF. |
| PACIENTE | Completar perfil si falta; luego `/mis-turnos` y `/mi-perfil`. |

La reserva, cancelación y reprogramación del paciente continúan mediante la salita: la API original solo habilitaba esas operaciones a administración. La pantalla informa esta regla. No se ampliaron esas facultades.

El menú comparte AppLayout, Sidebar y Navbar. ProtectedRoute controla los roles; el backend verifica además la identidad y el alcance de los datos. No se alteró el mecanismo de almacenamiento de tokens. Las renovaciones concurrentes del frontend comparten una petición.

## Comprobación manual

1. Ejecutar `npm run dev` en backend y frontend en terminales separadas.
2. Abrir Login y Registro en escritorio, tablet y celular. Revisar teclado, foco, mostrar/ocultar contraseña y ausencia de desplazamiento horizontal.
3. Ingresar manualmente con cada rol. Confirmar el destino, el menú y el rechazo al abrir una ruta administrativa con PACIENTE o PROFESIONAL.
4. Con dos administradores de salitas distintas, comprobar listados y consultas directas por ID de pacientes, profesionales, turnos y reportes.
5. Con un profesional vinculado, consultar agenda, marcar atención/inasistencia y descargar PDF. Cambiar el filtro o ID no debe devolver turnos de otro profesional.
6. Registrar un paciente con un correo propio, verificar el enlace, completar el perfil y volver a ingresar. Probar email y DNI repetidos.
7. Ingresar con Google nuevo y existente. Revisar el paso de completar perfil y que nunca se creen cuentas administrativas.
8. Solicitar recuperación con correo registrado y no registrado: mismo mensaje público. Probar token inválido, vencido y utilizado; cambiar contraseña e ingresar de nuevo.

El envío real de correos y la autorización de Google requieren comprobación con las cuentas y proveedores configurados. No se crearon cuentas reales para probarlos automáticamente.
