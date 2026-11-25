import PublicHero from '../../components/public/PublicHero';
import InformationalCarousel from '../../components/public/PublicCarousel';
import HowItWorks from '../../components/public/HowItWorks';
import PublicSalitasSection from '../../components/public/PublicSalitasSection';
import SapsNewsSection from '../../components/public/SapsNewsSection';
import MunicipalNewsSection from '../../components/public/MunicipalNewsSection';
import PublicHelpSection from '../../components/public/PublicHelpSection';

// Página principal pública de CORA.
// Cada sección obtiene sus datos y gestiona sus estados de forma independiente.
export default function PublicHomePage() {
  return (
    <>
      {/* 1. Presentación principal y accesos */}
      <PublicHero />

      {/* 2. Beneficios de CORA */}
      <InformationalCarousel />

      {/* 3. Guía paso a paso para el ciudadano */}
      <HowItWorks />

      {/* 4. Salitas barriales de atención con buscador y filtros */}
      <PublicSalitasSection />

      {/* 5. Novedades y avisos de salud comunitaria */}
      <SapsNewsSection />

      {/* 6. Noticias del portal municipal de Goya */}
      <MunicipalNewsSection />

      {/* 7. Asistencia ciudadana y preguntas frecuentes */}
      <PublicHelpSection />
    </>
  );
}
