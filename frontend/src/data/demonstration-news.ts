import type { PublicNews } from '../types/public-content.types';

// Contenido institucional de demostración para el sitio público de CORA en Goya, Corrientes.
// Se utiliza cuando no existen noticias de producción cargadas o para filtrar publicaciones de prueba.
export const DEMONSTRATION_NEWS: PublicNews[] = [
  {
    id_noticia: 'demo-vacunacion-antigripal',
    titulo: 'Campaña de Vacunación Antigripal en Salitas de Goya',
    resumen:
      'Comenzó la aplicación gratuita de dosis para grupos de riesgo, niños, adultos mayores y embarazadas en todos los centros de atención primaria de la ciudad.',
    contenido:
      'La red de atención CORA en Goya informa a toda la comunidad que se encuentra activa la campaña anual de vacunación antigripal en todas las salitas y centros de atención primaria de la red CORA.\n\nLa vacuna es libre y gratuita para personal de salud, personas gestantes en cualquier trimestre del embarazo, niños de 6 a 24 meses y personas mayores de 65 años.\n\nPara recibir la dosis correspondiente, los vecinos pueden acercarse de lunes a viernes con su DNI y carnet de vacunación al centro de salud barrial más cercano a su domicilio.',
    imagen_url: null,
    fecha_publicacion: '2026-11-20T10:00:00Z',
    fecha_finalizacion: null,
    destacada: true,
    categoria: {
      id_categoria: 'cat-vacunacion',
      nombre: 'Campañas de Salud',
      es_aviso: false,
    },
    salita: null,
  },
  {
    id_noticia: 'demo-jornadas-pediatria',
    titulo: 'Jornadas de Control Pediátrico y Salud Escolar en Barrios de Goya',
    resumen:
      'Equipos interdisciplinarios de salud recorren los barrios para realizar controles de crecimiento, salud bucodental y esquema de vacunación escolar.',
    contenido:
      'Durante las próximas semanas, profesionales médicos y enfermeros de la red CORA llevarán a cabo operativos de salud escolar y pediatría preventiva en las distintas zonas de Goya.\n\nLos controles incluyen valoración de peso y talla, examen oftalmológico básico, control odontológico preventivo y actualización obligatoria de vacunas de calendario nacional.\n\nLos turnos para control de niño sano pueden solicitarse también a través de la plataforma CORA con tu usuario de paciente.',
    imagen_url: null,
    fecha_publicacion: '2026-11-18T09:30:00Z',
    fecha_finalizacion: null,
    destacada: true,
    categoria: {
      id_categoria: 'cat-prevencion',
      nombre: 'Prevención y Cuidado',
      es_aviso: false,
    },
    salita: null,
  },
  {
    id_noticia: 'demo-atencion-integral',
    titulo: 'Fortalecimiento de Servicios de Enfermería y Control de Hipertensión',
    resumen:
      'Las salitas de atención primaria incorporan consultorios dedicados al control y seguimiento de enfermedades crónicas, toma de presión y curaciones.',
    contenido:
      'Con el compromiso de acercar la salud pública a cada familia, la red CORA amplió los servicios de control de tensión arterial, glucemia capilar y seguimiento personalizado para pacientes con enfermedades crónicas no transmisibles.\n\nEl servicio está disponible en todos los turnos matutinos y vespertinos en las salitas barriales habilitadas.',
    imagen_url: null,
    fecha_publicacion: '2026-11-15T11:00:00Z',
    fecha_finalizacion: null,
    destacada: false,
    categoria: {
      id_categoria: 'cat-servicios',
      nombre: 'Servicios Barriales',
      es_aviso: false,
    },
    salita: null,
  },
  {
    id_noticia: 'demo-aviso-emergencias',
    titulo: 'Línea 107 Habilitada para Urgencias y Emergencias Médicas',
    resumen:
      'Aviso importante: Ante situaciones que impliquen riesgo de vida o cuadros agudos, comunicarse de forma directa e inmediata con el 107.',
    contenido:
      'La plataforma CORA organiza la atención médica programada y preventiva en centros de atención primaria de la ciudad de Goya.\n\nAnte cualquier emergencia médica, accidente o urgencia aguda que requiera atención inmediata, comunicate directamente con la línea gratuita 107 o acudí a la guardia hospitalaria más cercana.',
    imagen_url: null,
    fecha_publicacion: '2026-11-22T08:00:00Z',
    fecha_finalizacion: null,
    destacada: false,
    categoria: {
      id_categoria: 'cat-avisos',
      nombre: 'Avisos a la Comunidad',
      es_aviso: true,
    },
    salita: null,
  },
];
