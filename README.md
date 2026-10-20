<a id="inicio"></a>

<div align="center">

# 🩺 CORA · SAPS Turno

### Gestión de turnos y atención primaria de la salud

**Salas de Atención Primaria de la Salud · Goya, Corrientes, Argentina**

Una plataforma para conectar pacientes, profesionales y equipos administrativos.

![Frontend](https://img.shields.io/badge/Frontend-React_19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-Express_5-333333?style=for-the-badge&logo=express&logoColor=white)
![Lenguaje](https://img.shields.io/badge/Lenguaje-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Base de datos](https://img.shields.io/badge/Datos-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

[Funciones](#funciones) · [Roles](#roles) · [Instalación](#instalacion) · [Arquitectura](#arquitectura) · [Autores](#autores)

</div>

---

## 📖 Acerca del proyecto

**SAPS Turno**, presentado en la interfaz como **CORA**, centraliza la organización de la atención en las salitas: pacientes, cobertura territorial, profesionales, especialidades, horarios y reservas.

El sistema incluye una **aplicación web** y una **API REST**. Cada usuario accede a funciones según su rol y las relaciones registradas en el sistema, como su salita asignada o su perfil profesional.

| 👤 Para pacientes | 🩺 Para profesionales | 🏥 Para administración |
| --- | --- | --- |
| Encontrar atención disponible y gestionar sus turnos. | Consultar su agenda y registrar el resultado de la atención. | Organizar recursos, gestionar cuentas y consultar la actividad de las salitas. |

<details>
<summary><strong>🧭 Índice de documentación</strong></summary>

- [Funciones principales](#funciones)
- [Roles y alcance](#roles)
- [Cómo se utiliza](#uso)
- [Reglas de reservas, sanciones y bloqueos](#reglas)
- [Herramientas y tecnologías](#tecnologias)
- [Arquitectura y organización](#arquitectura)
- [Instalación y configuración](#instalacion)
- [Comandos de desarrollo](#comandos)
- [API y documentación relacionada](#api)
- [Contribuciones](#contribuciones)
- [Autores y colaboradores](#autores)

</details>

---

<a id="funciones"></a>

## ✨ Funciones principales

| Módulo | Acciones disponibles |
| --- | --- |
| 🔐 **Acceso y cuentas** | Inicio de sesión, verificación de correo, recuperación de contraseña, acceso con Google para pacientes y administración de cuentas según permisos. |
| 👥 **Pacientes y tutores** | Registro de datos personales, perfil del paciente, información de contacto y vínculos con tutores. |
| 🏥 **Salitas y cobertura** | Gestión de salitas, barrios, zonas y relaciones que determinan la cobertura territorial. |
| 🩺 **Profesionales** | Registro de profesionales, matrícula, especialidades, asignaciones a salitas y cuentas de acceso. |
| 🗓️ **Horarios y disponibilidad** | Carga de varios días y franjas, duración de turnos, cupos, vigencias y bloqueos de agenda. |
| 🎟️ **Turnos** | Solicitud, consulta, confirmación, cancelación, reprogramación administrativa e historial de cambios. |
| ⚖️ **Sanciones** | Restricciones de reserva por inasistencia, consulta de sanciones y anulación administrativa según permisos. |
| 🔔 **Notificaciones** | Avisos internos, comunicaciones administrativas y envíos por correo según configuración. |
| 📊 **Reportes** | Resúmenes de actividad, información por especialidad y profesional, agenda diaria y exportaciones en PDF, Excel o Word según el reporte. |
| 📰 **Contenido público** | Página pública, novedades y administración de publicaciones. |
| ⚙️ **Configuración y auditoría** | Catálogos, parámetros del sistema y consulta de registros de auditoría mediante la API autorizada. |

<a id="roles"></a>

## 🛡️ Roles y alcance

Los permisos se verifican en el servidor. Una opción visible en la interfaz no reemplaza los controles de acceso de la API.

| Rol | Responsabilidad | Alcance general |
| --- | --- | --- |
| 👑 `SUPER_ADMIN` | Administración general del sistema, salitas, cuentas, catálogos, agendas y reportes. | Gestión global, sujeta a las validaciones de cada operación. |
| 🏥 `ADMIN_SALITA` | Gestión operativa de pacientes, profesionales, horarios, turnos y comunicaciones. | Salitas autorizadas para su cuenta. |
| 🩺 `PROFESIONAL` | Consulta de su agenda y registro de atención o inasistencia. | Información vinculada a su perfil y turnos autorizados. |
| 👤 `PACIENTE` | Gestión de su perfil, solicitud y cancelación de turnos propios, consulta de avisos. | Su cuenta, su cobertura y sus reservas. |
| 🧾 `RECEPCION` | Operaciones de atención administrativa habilitadas en determinadas rutas. | Rol contemplado en la API; no cuenta con un recorrido independiente completo en la interfaz actual. |

> [!NOTE]
> El alcance exacto depende de la ruta, el rol y las asignaciones vigentes. La autorización de una operación no implica acceso a todos los registros de una salita o del sistema.

<a id="uso"></a>

## 🚶 Cómo se utiliza

### 👤 Recorrido del paciente

1. Registrarse o iniciar sesión y completar las verificaciones requeridas.
2. Completar sus datos personales y revisar su cobertura.
3. Ingresar a **Solicitar turno**.
4. Elegir especialidad y profesional.
5. Seleccionar uno de los **días disponibles** del desplegable y luego un horario.
6. Confirmar la solicitud y consultar el turno desde **Mis turnos**.

### 🏥 Recorrido administrativo

1. Revisar las salitas, barrios y relaciones de cobertura.
2. Registrar al profesional y asignar sus especialidades y salitas.
3. Configurar los días de atención, las franjas horarias y la vigencia.
4. Gestionar reservas, cancelaciones y reprogramaciones.
5. Consultar la agenda, los reportes y las comunicaciones del equipo.

Al crear horarios, las asignaciones únicas se seleccionan automáticamente. Cuando hay varias opciones autorizadas, el administrador elige la correspondiente. Un mismo día puede tener más de una franja, por ejemplo mañana y tarde.

### 🩺 Recorrido del profesional

1. Ingresar con su cuenta vinculada al registro profesional.
2. Consultar su agenda de atención.
3. Registrar el resultado del turno: **atendido** o **no asistió**, según corresponda.

---

<a id="reglas"></a>

## 📅 Reglas de reservas, sanciones y bloqueos

### Ventana semanal

| Momento | Fechas habilitadas para el paciente |
| --- | --- |
| Antes del sábado a las 12:00 | Desde el día actual hasta el domingo de esa semana. |
| Desde el sábado a las 12:00 | También se habilita la semana siguiente completa. |

- La referencia horaria es **Argentina**, zona `America/Argentina/Buenos_Aires`.
- Se conservan los horarios restantes del fin de semana actual.
- La API verifica la ventana al consultar disponibilidad y al reservar.
- La pantalla actualiza la agenda periódicamente y al recuperar el foco.
- Esta restricción corresponde al autoservicio del paciente; administración conserva sus operaciones de gestión y reprogramación.

### Reservas por especialidad

Un paciente no puede mantener **dos turnos abiertos de la misma especialidad**, aunque seleccione profesionales diferentes. La restricción se comprueba en la aplicación y mediante un índice único en la base de datos.

Cuando un turno pasa a un estado que deja de impedir otra reserva —como atendido o cancelado— puede solicitarse uno nuevo, siempre que se cumplan las demás condiciones de disponibilidad y acceso.

### Inasistencias

La migración de sanciones incorpora una suspensión de **siete días —168 horas—** desde el registro de la inasistencia:

- Se genera al marcar el turno como **`NO_ASISTIO`**.
- Impide nuevas reservas de **todas las especialidades**.
- La interfaz informa la restricción, su motivo y su vencimiento.
- Al vencer o anularse la sanción, deja de impedir nuevas reservas.
- No cancela automáticamente los turnos que ya estaban reservados.

> [!IMPORTANT]
> La generación automática requiere aplicar [`20261020_sancion_global_inasistencia.sql`](backend/src/BBDD/20261020_sancion_global_inasistencia.sql) en la base de datos correspondiente. La presencia del archivo en el repositorio no confirma que la migración esté aplicada.
>
> La duración actual es fija: **siete días**. La configuración de una duración diferente por salita todavía no está implementada.

### Bloqueos de cuenta

Una cuenta deshabilitada o temporalmente bloqueada no puede continuar operando con normalidad. Los controles se aplican durante la autenticación, la renovación de sesión y las solicitudes protegidas, y la interfaz muestra un aviso modal para los distintos roles.

**Sanción de reservas** y **bloqueo de cuenta** son situaciones distintas: la primera restringe la solicitud de turnos; el segundo restringe el acceso a la cuenta.

---

<a id="tecnologias"></a>

## 🧰 Herramientas y tecnologías

| Área | Herramientas | Uso en el proyecto |
| --- | --- | --- |
| Interfaz | React 19 · TypeScript · Vite | Componentes, tipado y construcción de la aplicación web. |
| Diseño | Bootstrap 5 · Bootstrap Icons · CSS | Formularios, navegación, tablas, iconos y estilos. |
| Navegación y HTTP | React Router · Axios | Rutas de la aplicación y comunicación con la API. |
| Servidor | Node.js · Express 5 · TypeScript | API REST y lógica de negocio. |
| Datos | Supabase · PostgreSQL | Persistencia, relaciones, restricciones y triggers. |
| Validación | Zod | Validación de entradas y variables de entorno. |
| Autenticación | Argon2 · JOSE · Google Auth Library | Contraseñas, tokens y verificación de identidad con Google. |
| Correo | Nodemailer · SMTP | Verificación de correo y comunicaciones. |
| Documentos | PDFKit · ExcelJS · docx | Generación de reportes y exportaciones. |
| Verificación | Node Test Runner · tsx · TypeScript · Oxlint | Pruebas del backend, comprobación de tipos y análisis estático del frontend. |
| Middleware | Helmet · CORS · Morgan | Cabeceras HTTP, acceso entre orígenes y registro de solicitudes. |

Las versiones declaradas se encuentran en los archivos [`package.json` del backend](backend/package.json) y [del frontend](frontend/package.json).

<a id="arquitectura"></a>

## 🏗️ Arquitectura y organización

```mermaid
flowchart LR
    U["👥 Usuarios"] --> F["🌐 Frontend · React"]
    F -->|"HTTP / JSON"| A["🔐 API REST · Express"]
    A --> S["⚙️ Servicios y validaciones"]
    S --> R["🗃️ Repositorios"]
    R --> D[("Supabase · PostgreSQL")]
    S --> M["✉️ Correo SMTP"]
```

```text
SAPS_Turno/
├── backend/
│   ├── src/
│   │   ├── BBDD/           Esquema SQL y migraciones
│   │   ├── config/         Configuración e integraciones
│   │   ├── controllers/    Entrada y salida HTTP
│   │   ├── middlewares/    Autenticación, permisos y errores
│   │   ├── repositories/   Acceso a datos
│   │   ├── routes/         Rutas de la API
│   │   ├── services/       Reglas de negocio
│   │   ├── validators/     Esquemas de validación
│   │   ├── types/          Tipos compartidos del backend
│   │   └── utils/          Utilidades
│   └── tests/              Pruebas automatizadas
├── frontend/
│   └── src/
│       ├── components/     Componentes de interfaz
│       ├── context/        Sesión y estado compartido
│       ├── pages/          Pantallas por módulo
│       ├── routes/         Navegación y rutas protegidas
│       ├── services/       Clientes de la API
│       ├── styles/         Estilos de la aplicación
│       ├── types/          Tipos del frontend
│       └── utils/          Utilidades
└── README.md
```

---

<a id="instalacion"></a>

## 🚀 Instalación y configuración

### 1. Preparar el entorno

Se necesita Node.js compatible con las dependencias del proyecto, npm, una base de Supabase configurada y credenciales SMTP. Para el acceso mediante Google se requiere configurar su cliente de identidad.

```bash
git clone https://github.com/Arhiell/SAPS_Turno.git
cd SAPS_Turno
npm ci --prefix backend
npm ci --prefix frontend
```

### 2. Configurar el backend

Crear `backend/.env` a partir de [`backend/.env.example`](backend/.env.example). Si el archivo ya existe, conservar sus valores y completar únicamente los faltantes.

La definición que valida los nombres, requisitos y valores predeterminados está en [`backend/src/config/env.ts`](backend/src/config/env.ts).

| Grupo | Variables principales |
| --- | --- |
| Aplicación | `NODE_ENV`, `PORT`, `FRONTEND_URL` |
| Supabase | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`; `SUPABASE_JWKS_URL` es opcional |
| Sesiones | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_MINUTES`, `REFRESH_TOKEN_EXPIRES_DAYS` |
| Control de acceso | `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES` |
| Recuperación y verificación | `PASSWORD_RECOVERY_MINUTES`, `EMAIL_VERIFICATION_HOURS` |
| Google | `GOOGLE_CLIENT_ID` |
| Correo | `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL` |

El archivo de ejemplo puede contener nombres históricos: usar `env.ts` como referencia para la configuración vigente. El backend valida su configuración al iniciar.

### 3. Configurar el frontend

Crear `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu_identificador_de_cliente_google
```

El identificador de Google debe corresponder al configurado en el backend.

> [!WARNING]
> Las variables `VITE_*` se incorporan al código del navegador. No colocar allí claves secretas de Supabase, credenciales SMTP ni secretos JWT. Los archivos `.env` no deben publicarse.

### 4. Preparar la base de datos

El directorio [`backend/src/BBDD`](backend/src/BBDD) contiene el esquema y las migraciones.

- **Instalación nueva:** revisar el esquema inicial y las migraciones necesarias.
- **Base existente:** aplicar únicamente las migraciones pendientes, respetando sus dependencias.
- **Sanciones automáticas:** verificar especialmente la migración del **20/10/2026**.

> [!CAUTION]
> El esquema `SAPS_Turno_BBDD3_FINAL.sql` contiene instrucciones de eliminación de tablas. No utilizarlo como actualización de una base con datos que deban conservarse.

### 5. Iniciar la aplicación

Abrir dos terminales desde la raíz del repositorio:

```bash
# Terminal 1 · API
npm run dev --prefix backend
```

```bash
# Terminal 2 · Aplicación web
npm run dev --prefix frontend
```

| Servicio | Dirección de desarrollo |
| --- | --- |
| 🌐 Frontend | `http://localhost:5173` — comprobar la dirección informada por Vite |
| ⚙️ API | `http://localhost:3000/api` — salvo que se cambie `PORT` |
| 💚 Estado de la API | `http://localhost:3000/api/health` |

<a id="comandos"></a>

## 🛠️ Comandos de desarrollo

Ejecutar desde la raíz del repositorio:

| Acción | Comando |
| --- | --- |
| Iniciar backend en desarrollo | `npm run dev --prefix backend` |
| Iniciar frontend en desarrollo | `npm run dev --prefix frontend` |
| Comprobar tipos del backend | `npm run typecheck --prefix backend` |
| Ejecutar pruebas del backend | `npm test --prefix backend` |
| Analizar el frontend | `npm run lint --prefix frontend` |
| Compilar backend | `npm run build --prefix backend` |
| Compilar frontend | `npm run build --prefix frontend` |
| Iniciar backend compilado | `npm start --prefix backend` |
| Previsualizar frontend compilado | `npm run preview --prefix frontend` |

<details>
<summary><strong>🔧 Utilidades administrativas</strong></summary>

| Comando | Propósito |
| --- | --- |
| `npm run check:email --prefix backend` | Ejecutar la utilidad de comprobación de correo. |
| `npm run seed:superadmin --prefix backend` | Ejecutar la utilidad de creación de la cuenta superadministradora. |

Revisar la configuración y los scripts en [`backend/src/scripts`](backend/src/scripts) antes de ejecutarlos. Estas utilidades pueden enviar correos o modificar la base configurada.

</details>

`preview` permite revisar el frontend compilado localmente; no reemplaza la configuración de alojamiento de producción.

---

<a id="api"></a>

## 🔌 API y documentación relacionada

Todas las rutas siguientes utilizan el prefijo **`/api`**. La tabla identifica módulos; cada operación tiene sus propios métodos, parámetros y permisos.

| Familia de rutas | Responsabilidad |
| --- | --- |
| `/auth`, `/auth/google`, `/auth/email`, `/auth/password` | Sesiones, identidad, correo y recuperación de acceso. |
| `/users`, `/access-management` | Usuarios y administración de cuentas. |
| `/patients`, `/tutors` | Pacientes y tutores. |
| `/salitas`, `/barrios`, `/zonas`, `/salita-barrios` | Catálogos territoriales y cobertura. |
| `/profesionales`, `/especialidades` | Profesionales, asignaciones y especialidades. |
| `/horarios-atencion`, `/bloqueos-agenda` | Configuración de la agenda. |
| `/disponibilidad`, `/disponibilidad/fechas` | Horarios disponibles y fechas habilitadas para pacientes. |
| `/turnos`, `/sanciones` | Reservas y restricciones. |
| `/notificaciones`, `/reportes`, `/auditoria` | Comunicaciones, indicadores y trazabilidad. |
| `/configuracion`, `/public`, `/contenido` | Parámetros, contenido público y publicaciones. |

### 📚 Referencias del repositorio

- [Registro central de rutas](backend/src/routes/index.ts).
- [Navegación de la aplicación](frontend/src/routes/AppRoutes.tsx).
- [Configuración del entorno](backend/src/config/env.ts).
- [Pruebas del backend](backend/tests).
- [Esquema y migraciones SQL](backend/src/BBDD).
- [Migración de sanción global por inasistencia](backend/src/BBDD/20261020_sancion_global_inasistencia.sql).

<a id="contribuciones"></a>

## 🤝 Contribuciones

1. Crear una rama con un nombre que describa el cambio.
2. Mantener la organización por módulos y los controles de permisos del servidor.
3. Documentar cualquier cambio de configuración, API o base de datos.
4. Ejecutar las comprobaciones pertinentes y las pruebas relacionadas.
5. Presentar el cambio con una descripción del problema, la solución y su verificación.

Los cambios de base de datos deben incluir una migración revisable. No incorporar credenciales, información personal real ni archivos de entorno al repositorio.

<a id="autores"></a>

## 👨‍💻 Autores y colaboradores

El historial de Git registra contribuciones bajo los siguientes nombres:

| Colaborador | Referencia |
| --- | --- |
| **Arhiell** | [Perfil de GitHub](https://github.com/Arhiell) |
| **Ariel Ayala** | Historial de contribuciones del repositorio |
| **Andres Herrero** | Historial de contribuciones del repositorio |
| **Leonel Fernandez** | Historial de contribuciones del repositorio |
| **Dev2** | Alias registrado en el historial de Git |

Los nombres se presentan tal como aparecen en Git; distintos nombres pueden corresponder a una misma persona.

[📜 Consultar el historial de contribuciones](https://github.com/Arhiell/SAPS_Turno/commits)

### 📄 Licencia

El paquete del backend declara **ISC** en su `package.json`. Consultar la documentación de licencia que acompañe cada distribución; esa declaración no describe por sí sola una licencia unificada de todos los componentes del repositorio.

---

<div align="center">

**🏥 CORA · SAPS Turno**

Organización de la atención primaria · Goya, Corrientes

[⬆️ Volver al inicio](#inicio)

</div>
