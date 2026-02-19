import React, { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

const content = {
  es: {
    title: 'Fundación CASA: Ingreso de Artistas y Directrices del Programa',
    toggle: 'Switch to English',
    toggleFlag: '🇺🇸',
    sections: [
      {
        heading: '1. Nuestra Misión: El Santuario Soberano',
        body: 'La Fundación CASA es un motor cultural diseñado para reducir el riesgo del artista, preservar la propiedad creativa y reciclar el éxito en oportunidades futuras. En una era de contenido automatizado, proporcionamos un "Santuario Soberano"—un espacio para que los artistas creen música auténtica y de alta calidad, respaldada por infraestructura humana profesional.'
      },
      {
        heading: '2. Proceso de Envío e Ingreso',
        body: 'Buscamos "High Heat"—excelencia creativa y alma auténtica.',
        list: [
          'Envío Inicial: Los artistas pueden tener una canción en el portal de envío a la vez.',
          'Actualizaciones: Puedes iniciar sesión en tu perfil en copas.app para cambiar tu archivo de audio o actualizar detalles en cualquier momento antes de la fecha límite de selección mensual.',
          'La Regla del "Andamio": Para la fase de demo, puedes usar herramientas como instrumentales generados por Suno o loops de Splice para mostrar tu visión.',
          'Retroalimentación: Cada envío es revisado por nuestro equipo de producción. Si tu demo muestra potencial pero no está listo para una beca, proporcionaremos retroalimentación y podemos sugerir una Sesión de Demo CASA para ayudarte a alcanzar un nivel "Listo para Beca".'
        ]
      },
      {
        heading: '3. El Requisito de "Humano Certificado"',
        body: 'Al enviar tu trabajo, verificas y garantizas que:',
        list: [
          'La interpretación vocal es tu voz humana biológica real.',
          'Las voces no son generadas por IA, deepfake, ni modeladas a partir de otra persona. Si bien apoyamos las herramientas digitales para la composición, el Master producido final siempre presentará tu voz real en el centro.'
        ]
      },
      {
        heading: '4. Niveles del Programa y Detalles de las Becas',
        body: 'El programa opera en dos capas complementarias para asegurar un impulso continuo:',
        subsections: [
          {
            subheading: 'Nivel 1: La Beca Mensual de Sencillo (Valor de 50,000 Pesos)',
            list: [
              'Tiempo de Estudio: Dos días de grabación en Casa de Copas en la Ciudad de México.',
              'Producción: Soporte completo de un productor profesional, mezcla y masterización.',
              'Spotlight de Radio: Una entrevista destacada y estreno del sencillo en 91.3 Alpha.',
              'Opción de Fondos Igualados: Para desarrollo continuo, también ofrecemos pistas de fondos igualados donde la Fundación iguala los presupuestos de grabación del artista 50/50.'
            ]
          },
          {
            subheading: 'Nivel 2: Proyectos de Álbum Completamente Financiados',
            list: [
              'El "Gran Premio": Periódicamente, socios corporativos financian la producción completa de un disco para un artista participante.',
              'Selección: Basada en mérito creativo, participación y tracción demostrada de lanzamientos anteriores del programa.'
            ]
          }
        ]
      },
      {
        heading: '5. Distribución Obligatoria y El Fondo Semilla',
        body: 'Para mantener un ecosistema regenerativo, todos los participantes aceptan los siguientes términos administrativos:',
        list: [
          'Distribución Symphonic: La distribución a través de nuestros socios en Symphonic es obligatoria para todas las canciones producidas a través del programa.',
          'Contabilidad Automatizada: Las divisiones de ingresos se manejan directamente a nivel del distribuidor mediante una Carta de Autorización (LOA) para total transparencia y automatización.',
          'El Ciclo Regenerativo: Aceptas una división de ingresos del 15% para sencillos o 30% para álbumes completos. Estas contribuciones van directamente al fondo de becas para ayudar a proporcionar esta misma oportunidad a futuros artistas.',
          '100% de Propiedad: Retienes la propiedad total de tus masters y publishing. Somos "plomeros, no parásitos"—proporcionamos las tuberías, tú eres dueño del agua.'
        ]
      },
      {
        heading: '6. Apoyo Integral al Artista',
        body: 'Creemos que los artistas saludables crean el mejor trabajo. Proporcionamos:',
        list: [
          'Nutrición y Bienestar: Cajas de productos, yoga y sesiones de respiración.',
          'Salud: Chequeos médicos y dentales a precio de costo.',
          'Advocacy: Curación activa, guía de estrategia de lanzamiento y advocacy en playlists/radio.'
        ]
      }
    ],
    faqTitle: 'Preguntas Frecuentes (FAQ) para Artistas',
    faqs: [
      { q: '¿Cuál es la misión principal de la Fundación CASA?', a: 'La misión de la Fundación CASA es actuar como un "Santuario Soberano" y un motor cultural para reducir el riesgo del artista, preservar la propiedad creativa y reciclar el éxito en oportunidades futuras, apoyando la creación de música auténtica y de alta calidad con infraestructura humana profesional.' },
      { q: '¿Qué es el "High Heat" que busca la Fundación?', a: 'La Fundación busca "High Heat", definido como excelencia creativa y alma auténtica en la música.' },
      { q: '¿Cuántas canciones puede enviar un artista a la vez?', a: 'Los artistas están limitados a tener solo una canción en el portal de envío a la vez.' },
      { q: '¿Dónde puedo actualizar los detalles de mi envío o cambiar mi archivo de audio?', a: 'Puedes iniciar sesión en tu perfil en copas.app para cambiar tu archivo de audio o actualizar detalles en cualquier momento antes de la fecha límite de selección mensual.' },
      { q: '¿Qué es la Regla del "Andamio" y puedo usar herramientas de IA para mi demo?', a: 'La Regla del "Andamio" permite a los artistas usar herramientas como instrumentales generados por Suno o loops de Splice durante la fase de demo para mostrar su visión.' },
      { q: '¿Cuál es el Requisito de "Humano Certificado" para las voces?', a: 'El Requisito de "Humano Certificado" exige que la interpretación vocal sea tu voz humana biológica real. Las voces no deben ser generadas por IA, deepfake, ni modeladas a partir de otra persona.' },
      { q: '¿Si mi demo no está listo para una beca, recibiré retroalimentación?', a: 'Sí, cada envío es revisado por el equipo de producción. Si tu demo muestra potencial pero no está listo para una beca, el equipo proporcionará retroalimentación y puede sugerir una Sesión de Demo CASA para ayudarte a alcanzar el nivel necesario.' },
      { q: '¿Qué incluye la Beca Mensual de Sencillo Nivel 1 y quién puede usar el programa?', a: 'El programa puede ser utilizado por cualquier artista para producir demos o sencillos. La Beca Mensual de Sencillo tiene un valor de 50,000 Pesos e incluye dos días de grabación en Casa de Copas en la Ciudad de México, soporte completo de un productor profesional, mezcla, masterización y una entrevista/estreno del sencillo en la radio 91.3 Alpha.' },
      { q: '¿Existe una opción de cofinanciamiento para un proyecto?', a: 'Sí, para desarrollo continuo, la Fundación ofrece un número limitado de pistas de fondos igualados para ayudar a artistas prometedores a desarrollarse dentro del sistema. La Fundación iguala el presupuesto de grabación del artista 50/50.' },
      { q: '¿Cómo se seleccionan los Proyectos de Álbum Completamente Financiados?', a: 'Los Proyectos de Álbum Completamente Financiados (el "Gran Premio") son periódicamente financiados por socios corporativos y se seleccionan basándose en mérito creativo, participación y tracción demostrada de lanzamientos anteriores del programa.' },
      { q: '¿Se requiere un distribuidor específico para las canciones producidas a través del programa?', a: 'Sí, la distribución a través de nuestros socios en Symphonic es obligatoria para todas las canciones producidas a través del programa.' },
      { q: '¿Cómo se manejan las divisiones de ingresos?', a: 'Las divisiones de ingresos se manejan directamente a nivel del distribuidor mediante una Carta de Autorización (LOA) para total transparencia y contabilidad automatizada.' },
      { q: '¿Cuál es la división de ingresos y a quién aplica?', a: 'La división de ingresos del 15% para sencillos o 30% para álbumes completos aplica solo a las grabaciones realizadas por los ganadores de becas completas a través del programa de la Fundación CASA. Estas contribuciones van directamente al fondo de becas para crear un "Ciclo Regenerativo".' },
      { q: '¿Enviar un demo afecta mi propiedad o crea obligaciones?', a: 'Enviar un demo no transfiere la propiedad de tu trabajo, y no se crean obligaciones para lanzar a través de nuestra infraestructura. Los artistas retienen el 100% de la propiedad de sus masters y publishing en todo momento.' },
      { q: '¿Qué tipos de apoyo integral proporciona la Fundación a los artistas?', a: 'La Fundación proporciona apoyo en: Nutrición y Bienestar (cajas de productos, yoga y sesiones de respiración), Salud (este servicio está actualmente en desarrollo, disponible para los ganadores de nuestras becas completas), y Advocacy (curación activa, guía de estrategia de lanzamiento y advocacy en playlists/radio). Nota: Los servicios de apoyo integral están disponibles por tiempo limitado para los ganadores de nuestras becas completas, y según el financiamiento lo permita.' },
      { q: '¿Dónde se realiza el tiempo de estudio para la Beca Mensual de Sencillo?', a: 'Los dos días de grabación para la Beca Mensual de Sencillo se realizan en Casa de Copas en la Ciudad de México.' },
      { q: '¿Cuál es la contribución financiera del artista para la Opción de Fondos Igualados?', a: 'La Fundación ofrece una igualación 50/50, lo que significa que el artista contribuye el 50% del presupuesto de grabación.' },
      { q: '¿Qué servicios incluye el apoyo de Advocacy?', a: 'El apoyo de Advocacy incluye curación activa, guía de estrategia de lanzamiento y advocacy en playlists/radio.' },
      { q: '¿Qué significa la declaración "plomeros, no parásitos" respecto a la propiedad del artista?', a: 'Esta analogía significa que la Fundación proporciona la infraestructura ("las tuberías") mientras el artista retiene el 100% de la propiedad de sus masters y publishing ("el agua").' },
      { q: '¿Qué es el "Ciclo Regenerativo"?', a: 'El "Ciclo Regenerativo" es el proceso donde las contribuciones de la división de ingresos (15% para sencillos, 30% para álbumes) de los ganadores de becas completas van directamente al fondo de becas para apoyar a futuros artistas.' }
    ]
  },
  en: {
    title: 'CASA Foundation: Artist Intake & Program Guidelines',
    toggle: 'Cambiar a Español',
    toggleFlag: '🇲🇽',
    sections: [
      {
        heading: '1. Our Mission: The Sovereign Sanctuary',
        body: 'The CASA Foundation is a cultural engine designed to reduce artist risk, preserve creative ownership, and recycle success into future opportunities. In an era of automated content, we provide a "Sovereign Sanctuary"—a space for artists to create high-quality, authentic music supported by professional human infrastructure.'
      },
      {
        heading: '2. Submission & Intake Process',
        body: 'We are looking for "High Heat"—creative excellence and authentic soul.',
        list: [
          'Initial Submission: Artists may have one song in the submission portal at any time.',
          'Updates: You can log in to your profile at copas.app to swap out your audio file or update details at any time before the monthly selection deadline.',
          'The "Scaffold" Rule: For the demo phase, you are welcome to use tools like Suno-generated instrumentals or Splice loops to showcase your vision.',
          'Feedback: Every submission is reviewed by our production team. If your demo shows promise but isn\'t ready for a grant, we will provide feedback and may suggest a CASA Demo Session to help you reach a "Grant-Ready" level.'
        ]
      },
      {
        heading: '3. The "Certified Human" Requirement',
        body: 'By submitting your work, you verify and guarantee that:',
        list: [
          'The vocal performance is your actual, biological human voice.',
          'The vocals are not AI-generated, deep-faked, or modeled after another person. While we support digital tools for composition, the final produced Master will always feature your real voice at the center.'
        ]
      },
      {
        heading: '4. Program Tiers & Grant Details',
        body: 'The program operates on two complementary layers to ensure continuous momentum:',
        subsections: [
          {
            subheading: 'Tier 1: The Monthly Single Grant (50,000 Peso Value)',
            list: [
              'Studio Time: Two days of tracking at Casa de Copas in Mexico City.',
              'Production: Full support from a professional producer, mixing, and mastering.',
              'Radio Spotlight: A featured interview and single premiere on 91.3 Alpha.',
              'Matched-Fund Option: For ongoing development, we also offer matched-fund tracks where the Foundation matches artist recording budgets 50/50.'
            ]
          },
          {
            subheading: 'Tier 2: Fully Funded Album Projects',
            list: [
              'The "Grand Prize": Periodically, corporate partners underwrite the full production of a complete record for a participating artist.',
              'Selection: Based on creative merit, participation, and demonstrated traction from prior program releases.'
            ]
          }
        ]
      },
      {
        heading: '5. Mandatory Distribution & The Seed Fund',
        body: 'To maintain a regenerative ecosystem, all participants agree to the following administrative terms:',
        list: [
          'Symphonic Distribution: Distribution through our partners at Symphonic is required for all songs produced through the program.',
          'Automated Accounting: Revenue splits are handled directly at the distributor level via a Letter of Authorization (LOA) for complete transparency and automation.',
          'The Regenerative Loop: You agree to a revenue split of 15% for singles or 30% for full albums. These contributions go directly back into the grant fund to help provide this same opportunity for future artists.',
          '100% Ownership: You retain full ownership of your masters and publishing. We are "plumbers, not parasites"—we provide the pipes, you own the water.'
        ]
      },
      {
        heading: '6. Holistic Artist Support',
        body: 'We believe that healthy artists create the best work. We provide:',
        list: [
          'Nutrition & Wellness: Produce boxes, yoga, and breathwork sessions.',
          'Healthcare: At-cost health and dental checkups.',
          'Advocacy: Active curation, release strategy guidance, and playlist/radio advocacy.'
        ]
      }
    ],
    faqTitle: 'Frequently Asked Questions (FAQ) for Artists',
    faqs: [
      { q: 'What is the core mission of the CASA Foundation?', a: 'The CASA Foundation\'s mission is to act as a "Sovereign Sanctuary" and a cultural engine to reduce artist risk, preserve creative ownership, and recycle success into future opportunities, supporting the creation of high-quality, authentic music with professional human infrastructure.' },
      { q: 'What is the "High Heat" the Foundation is looking for?', a: 'The Foundation is looking for "High Heat," which is defined as creative excellence and authentic soul in the music.' },
      { q: 'How many songs can an artist submit at one time?', a: 'Artists are limited to having only one song in the submission portal at any time.' },
      { q: 'Where can I update my submission details or swap out my audio file?', a: 'You can log in to your profile at copas.app to swap out your audio file or update details at any time before the monthly selection deadline.' },
      { q: 'What is the "Scaffold" Rule, and can I use AI tools for my demo?', a: 'The "Scaffold" Rule allows artists to use tools like Suno-generated instrumentals or Splice loops during the demo phase to showcase their vision.' },
      { q: 'What is the "Certified Human" Requirement for vocals?', a: 'The "Certified Human" Requirement mandates that the vocal performance must be your actual, biological human voice. Vocals must not be AI-generated, deep-faked, or modeled after another person.' },
      { q: 'If my demo isn\'t ready for a grant, will I receive feedback?', a: 'Yes, every submission is reviewed by the production team. If your demo shows promise but is not grant-ready, the team will provide feedback and may suggest a CASA Demo Session to help you reach the necessary level.' },
      { q: 'What does the Tier 1 Monthly Single Grant include, and who can use the program?', a: 'The program can be used by any artist to produce demos or singles. The Monthly Single Grant is valued at 50,000 Pesos and includes two days of tracking at Casa de Copas in Mexico City, full support from a professional producer, mixing, mastering, and a featured interview/single premiere on 91.3 Alpha radio.' },
      { q: 'Is there an option for co-funding a project?', a: 'Yes, for ongoing development, the Foundation offers a limited number of matched-fund tracks to help promising artists develop within the system. The Foundation matches the artist\'s recording budget 50/50.' },
      { q: 'How are Fully Funded Album Projects selected?', a: 'Fully Funded Album Projects (the "Grand Prize") are periodically underwritten by corporate partners and are selected based on creative merit, participation, and demonstrated traction from prior program releases.' },
      { q: 'Is a specific distributor required for songs produced through the program?', a: 'Yes, distribution through our partners at Symphonic is mandatory for all songs produced through the program.' },
      { q: 'How are revenue splits managed?', a: 'Revenue splits are handled directly at the distributor level via a Letter of Authorization (LOA) for complete transparency and automated accounting.' },
      { q: 'What is the revenue split and to whom does it apply?', a: 'The revenue split of 15% for singles or 30% for full albums applies only to the recordings made by the full grant winners through the CASA Foundation program. These contributions go directly back into the grant fund to create a "Regenerative Loop."' },
      { q: 'Does submitting a demo affect my ownership or create obligations?', a: 'Submitting a demo does not transfer ownership of your work, and there are no obligations created to release through our infrastructure. Artists retain 100% ownership of their masters and publishing at all times.' },
      { q: 'What types of holistic support does the Foundation provide to artists?', a: 'The Foundation provides support in: Nutrition & Wellness (produce boxes, yoga, and breathwork sessions), Healthcare (this service is currently in development, available to winners of full grant giveaways), and Advocacy (active curation, release strategy guidance, and playlist/radio advocacy). Note: Holistic support services are available for a limited time to the winners of full grant giveaways, and as funding allows.' },
      { q: 'Where is the studio time for the Monthly Single Grant located?', a: 'The two days of tracking for the Monthly Single Grant are held at Casa de Copas in Mexico City.' },
      { q: 'What is the artist\'s financial contribution for the Matched-Fund Option?', a: 'The Foundation offers a 50/50 match, meaning the artist contributes 50% of the recording budget.' },
      { q: 'What services are included in the Advocacy support?', a: 'The Advocacy support includes active curation, release strategy guidance, and playlist/radio advocacy.' },
      { q: 'What is the meaning of the "plumbers, not parasites" statement regarding artist ownership?', a: 'This analogy means the Foundation provides the infrastructure ("the pipes") while the artist retains 100% ownership of their masters and publishing ("the water").' },
      { q: 'What is the "Regenerative Loop"?', a: 'The "Regenerative Loop" is the process where the revenue split contributions (15% for singles, 30% for albums) from full grant winners go directly back into the grant fund to support future artists.' }
    ]
  }
}

function ArtistGuidelines({ onClose }) {
  const [lang, setLang] = useState('es')
  const c = content[lang]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2000,
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '1rem auto',
        backgroundColor: '#fffdf7',
        borderRadius: '20px',
        padding: '2rem 1.5rem',
        position: 'relative',
        minHeight: 'calc(100vh - 2rem)'
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '0.5rem'
        }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(139, 69, 19, 0.1)',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#8b4513',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={16} />
            {lang === 'es' ? 'Volver' : 'Back'}
          </button>

          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #8b0000, #dc143c)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{c.toggleFlag}</span>
            {c.toggle}
          </button>
        </div>

        {/* Title */}
        <h1 style={{
          color: '#8b4513',
          fontSize: '1.5rem',
          margin: '0 0 1.5rem',
          lineHeight: '1.3',
          textAlign: 'center'
        }}>
          {c.title}
        </h1>

        {/* Sections */}
        {c.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              color: '#8b4513',
              fontSize: '1.1rem',
              margin: '0 0 0.5rem',
              lineHeight: '1.3'
            }}>
              {section.heading}
            </h2>
            <p style={{
              color: '#5a3a1a',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              margin: '0 0 0.5rem'
            }}>
              {section.body}
            </p>
            {section.list && (
              <ul style={{
                margin: '0 0 0.5rem',
                paddingLeft: '1.25rem',
                color: '#5a3a1a',
                fontSize: '0.9rem',
                lineHeight: '1.7'
              }}>
                {section.list.map((item, j) => (
                  <li key={j} style={{ marginBottom: '0.4rem' }}>{item}</li>
                ))}
              </ul>
            )}
            {section.subsections && section.subsections.map((sub, k) => (
              <div key={k} style={{ marginLeft: '0.5rem', marginBottom: '0.75rem' }}>
                <h3 style={{
                  color: '#a0522d',
                  fontSize: '1rem',
                  margin: '0.5rem 0 0.35rem',
                  fontWeight: '600'
                }}>
                  {sub.subheading}
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  color: '#5a3a1a',
                  fontSize: '0.9rem',
                  lineHeight: '1.7'
                }}>
                  {sub.list.map((item, j) => (
                    <li key={j} style={{ marginBottom: '0.4rem' }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {/* Divider */}
        <hr style={{
          border: 'none',
          borderTop: '2px solid rgba(210, 105, 30, 0.2)',
          margin: '2rem 0'
        }} />

        {/* FAQ */}
        <h2 style={{
          color: '#8b4513',
          fontSize: '1.3rem',
          margin: '0 0 1rem',
          textAlign: 'center'
        }}>
          {c.faqTitle}
        </h2>

        {c.faqs.map((faq, i) => (
          <div key={i} style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(210, 105, 30, 0.05)',
            borderRadius: '12px',
            borderLeft: '3px solid #d2691e'
          }}>
            <p style={{
              color: '#8b4513',
              fontWeight: '600',
              fontSize: '0.9rem',
              margin: '0 0 0.35rem',
              lineHeight: '1.4'
            }}>
              {i + 1}. {faq.q}
            </p>
            <p style={{
              color: '#5a3a1a',
              fontSize: '0.85rem',
              margin: 0,
              lineHeight: '1.6'
            }}>
              {faq.a}
            </p>
          </div>
        ))}

        {/* Bottom close */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              background: 'rgba(210, 105, 30, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            {lang === 'es' ? 'Cerrar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArtistGuidelines
