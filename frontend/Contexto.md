Estamos continuando el proyecto SAPS Turno.

Ahora necesito preparar DATOS REALES DE PRUEBA MANUAL para poder probar todo el flujo del sistema desde el frontend.

NO crear tests automáticos.

Yo voy a realizar las pruebas manualmente desde la interfaz.

==================================================
OBJETIVO
==================================================

Necesito dejar configuradas inicialmente DOS salitas:

1. CIC GOYA NORTE
2. CIC GOYA SUR

Cada salita debe tener:

- sus datos institucionales
- un ADMIN_SALITA propio
- profesionales asignados
- especialidades
- horarios de atención
- disponibilidad

El objetivo final es poder ingresar como PACIENTE y solicitar realmente un turno utilizando los datos cargados.

==================================================
IMPORTANTE
==================================================

Antes de crear datos:

- Revisar la base de datos actual.
- Revisar endpoints existentes.
- Revisar si las salitas ya existen.
- Revisar si existen zonas/barrios/especialidades relacionadas.
- No duplicar registros.
- No crear tablas nuevas.
- No modificar arquitectura.
- Reutilizar APIs y servicios actuales.
- Preferir cargar los datos mediante los endpoints existentes si la funcionalidad ya está disponible.

No usar Prisma.

Mantener:

Route → Middleware → Controller → Service → Repository → Supabase

==================================================
1. SALITAS
==================================================

Crear o completar:

CIC GOYA NORTE

Nombre:
CIC Goya Norte

Código sanitario de referencia:
14000

Dirección:
Av. Leandro N. Alem y Bella Vista
Goya, Corrientes

----------------------------

CIC GOYA SUR

Nombre:
CIC Goya Sur

Código sanitario de referencia:
14001

Dirección:
Caá Guazú y Av. Perón
Goya, Corrientes

Usar solamente campos que realmente existan en la tabla salitas.

Si no existe una columna para código sanitario:
NO modificar la base de datos solamente para esta prueba.

==================================================
2. ADMINISTRADORES
==================================================

Cada salita debe tener un ADMIN_SALITA distinto.

Ejemplo:

CIC GOYA NORTE
→ Admin CIC Norte

CIC GOYA SUR
→ Admin CIC Sur

No hardcodear contraseñas dentro del código fuente.

Si necesitamos crear cuentas para pruebas, hacerlo mediante el mecanismo administrativo existente.

Verificar:

- rol = ADMIN_SALITA
- usuario activo
- relación con la salita correspondiente

ADMIN CIC NORTE:

solo debe poder administrar CIC Norte.

ADMIN CIC SUR:

solo debe poder administrar CIC Sur.

Probar que un administrador NO pueda modificar datos de la otra salita.

==================================================
3. PROFESIONALES
==================================================

Necesito cargar manualmente algunos profesionales de prueba.

No crear una cantidad excesiva.

Para cada salita podemos tener inicialmente 2 o 3 profesionales.

Ejemplo:

CIC GOYA NORTE

Profesional 1
Especialidad: Medicina General

Profesional 2
Especialidad: Pediatría

Profesional 3
Especialidad: Enfermería, solamente si esta especialidad existe en el modelo actual.

----------------------------

CIC GOYA SUR

Profesional 1
Especialidad: Medicina General

Profesional 2
Especialidad: Pediatría

Profesional 3
Especialidad disponible en el sistema.

IMPORTANTE:

Primero consultar las especialidades existentes.

No crear nombres duplicados.

Si ya existen:
reutilizarlas.

==================================================
4. PROFESIONAL ↔ SALITA
==================================================

Asignar correctamente cada profesional.

Ejemplo:

Profesional Norte 1
→ CIC Goya Norte

Profesional Norte 2
→ CIC Goya Norte

Profesional Sur 1
→ CIC Goya Sur

No dejar profesionales sin relación con su salita.

Reutilizar:

profesional-salita

que ya existe en el proyecto.

==================================================
5. PROFESIONAL ↔ ESPECIALIDAD
==================================================

Asignar las especialidades mediante la relación existente:

profesional-especialidad

No crear relaciones duplicadas.

==================================================
6. HORARIOS
==================================================

Configurar horarios simples que permitan probar turnos fácilmente.

Ejemplo inicial:

MEDICINA GENERAL

Lunes a viernes

08:00 → 12:00

Duración de turno:
20 minutos

----------------------------

PEDIATRÍA

Lunes a viernes

14:00 → 18:00

Duración:
20 minutos

Adaptarlo al modelo real de horarios_atencion.

No inventar campos que no existan.

==================================================
7. DISPONIBILIDAD
==================================================

Ya existe la funcionalidad de disponibilidad.

NO crear otra lógica.

Actualmente tenemos:

GET /api/disponibilidad

con filtros similares a:

fecha
id_profesional
id_especialidad
id_salita

Después de cargar horarios, comprobar que genere slots disponibles correctamente.

==================================================
8. FLUJO QUE NECESITO PROBAR
==================================================

Quiero poder realizar manualmente:

PACIENTE
    ↓
Login
    ↓
Solicitar turno
    ↓
Seleccionar salita
    ↓
Seleccionar especialidad
    ↓
Seleccionar profesional
    ↓
Seleccionar fecha
    ↓
Ver disponibilidad
    ↓
Elegir horario
    ↓
Confirmar turno

==================================================
9. PRIMER ESCENARIO
==================================================

Paciente selecciona:

CIC Goya Norte

Especialidad:
Medicina General

Profesional:
uno de CIC Norte

Fecha:
día con horario configurado

Debe mostrar los slots disponibles.

Selecciono uno.

Creo turno.

Después verificar que:

- aparece en Mis Turnos
- aparece en Turnos del ADMIN CIC Norte
- aparece en agenda del PROFESIONAL
- NO aparece como turno perteneciente a CIC Sur

==================================================
10. SEGUNDO ESCENARIO
==================================================

Repetir con:

CIC Goya Sur

y comprobar aislamiento entre salitas.

==================================================
11. PROFESIONAL
==================================================

Después quiero iniciar sesión como profesional.

Debe poder ver:

- su agenda
- pacientes asignados
- horarios
- estado del turno

Debe poder marcar:

ATENDIDO

o

NO_ASISTIO

según los permisos actuales.

No agregar funcionalidades nuevas si esto ya existe.

==================================================
12. ADMIN_SALITA
==================================================

ADMIN CIC NORTE debe visualizar:

- profesionales CIC Norte
- pacientes/turnos correspondientes
- agenda CIC Norte

No debe administrar CIC Sur.

ADMIN CIC SUR:

exactamente lo contrario.

==================================================
13. SUPER_ADMIN
==================================================

SUPER_ADMIN sí debe poder visualizar:

CIC Norte
CIC Sur

y todos sus:

- profesionales
- especialidades
- horarios
- turnos

==================================================
14. DATOS DE PRUEBA
==================================================

Para nombres de profesionales podemos utilizar datos FICTICIOS.

Ejemplo:

Dra. Ana López
Dr. Martín Gómez
Dra. Carla Fernández
Dr. Pablo Ramírez

NO presentar esos nombres como profesionales reales de estas salitas.

Son únicamente datos para desarrollo.

==================================================
15. NO DUPLICAR DATOS
==================================================

Antes de crear:

- buscar salita por nombre
- buscar usuario/email
- buscar profesional
- buscar especialidad
- comprobar relaciones

Si ya existe:
usar el registro existente.

==================================================
16. CARGA DE DATOS
==================================================

Preferencia:

Utilizar el propio sistema/frontend para cargar:

salitas
administradores
profesionales
especialidades
horarios

porque quiero comprobar también esas funcionalidades.

Solamente crear un script auxiliar de carga si alguna parte todavía no puede hacerse desde la aplicación.

No insertar directamente en Supabase si existe un endpoint válido para realizar esa operación.

==================================================
17. COMENTARIOS EN CÓDIGO
==================================================

Si se necesita modificar código, agregar comentarios breves.

Ejemplos:

// Busca la salita antes de crearla.

// Evita relaciones duplicadas.

// Asigna el profesional a la salita.

// Define su horario de atención.

// Reutiliza la disponibilidad existente.

No llenar cada línea de comentarios.

==================================================
18. NO CREAR TESTS
==================================================

No utilizar:

Jest
Vitest
Cypress
Playwright

Yo realizaré todas las pruebas manualmente desde el navegador.

Sí verificar compilación:

Backend:

npm run typecheck
npm run build

Frontend:

npm run build

==================================================
RESULTADO ESPERADO
==================================================

Quiero terminar teniendo:

SUPER_ADMIN

        ↓

CIC GOYA NORTE
    ↓
ADMIN NORTE
    ↓
Profesionales
    ↓
Especialidades
    ↓
Horarios
    ↓
Disponibilidad

CIC GOYA SUR
    ↓
ADMIN SUR
    ↓
Profesionales
    ↓
Especialidades
    ↓
Horarios
    ↓
Disponibilidad

Y luego poder realizar:

PACIENTE
    ↓
Solicitar turno
    ↓
Salita
    ↓
Especialidad
    ↓
Profesional
    ↓
Horario disponible
    ↓
Confirmar turno
    ↓
Profesional recibe el turno en su agenda

Primero revisar qué datos ya existen actualmente y realizar los cambios mínimos necesarios para dejar este flujo preparado para mis pruebas manuales.