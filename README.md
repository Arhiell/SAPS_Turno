# SAPS Turno

Sistema integral para la gestión de turnos de las Salas de Atención
Primaria de la Salud (SAPS) de Goya, Corrientes.

## Objetivo

Centralizar la gestión de pacientes, profesionales, especialidades,
salitas, agendas y turnos mediante una plataforma web.
La API REST facilita la consulta de disponibilidad, la asignación de turnos
y la administración de especialidades médicas para optimizar la atención
de los ciudadanos a nivel municipal.

## Estructura

```text
SAPS_Turno_API/
├── backend/
│   ├── src/           API REST y lógica de negocio
│   ├── tests/         Pruebas del backend
│   ├── package.json
│   └── tsconfig.json
├── frontend/          Aplicación web (pendiente de desarrollo)
├── README.md
└── .gitignore
```

## Backend

Ejecutar desde la raíz del repositorio:

```bash
cd backend
npm install
```

Para una instalación nueva, copiar `backend/.env.example` a `backend/.env`
y completar los valores de Supabase, autenticación y correo SMTP.
Si ya existe un `.env`, conservar sus valores y completar las variables faltantes.

Desde `backend/`:

```bash
npm run typecheck
npm run build
npm run dev
```

Para ejecutar la versión compilada, usar `npm start` después de `npm run build`.
Desde la raíz también se pueden ejecutar los comandos con
`npm --prefix backend run <script>`.
