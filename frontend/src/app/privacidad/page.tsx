import type { Metadata } from 'next';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Qué datos guarda Raccord, cómo los usa y qué derechos tenés sobre tu información.',
};

const CONTACTO = 'rosatomas.contact@gmail.com';
const ACTUALIZADO = '11 de julio de 2026';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-papel">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-papel/70">{children}</div>
    </section>
  );
}

export default function PaginaPrivacidad() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Legales</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">Política de privacidad</h1>
      <p className="mt-3 text-sm text-papel/50">Última actualización: {ACTUALIZADO}</p>

      <p className="mt-6 text-sm leading-relaxed text-papel/70">
        Raccord es una plataforma sobre cine de autor. Esta política explica qué datos
        personales recopilamos cuando usás el sitio, con qué fin y qué control tenés sobre
        ellos. Al crear una cuenta o iniciar sesión, aceptás lo descripto acá.
      </p>

      <Seccion titulo="Qué datos recopilamos">
        <p>Solo guardamos lo necesario para que tu cuenta funcione:</p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <strong className="text-papel/90">Cuenta con email:</strong> tu email, un nombre
            de usuario y tu contraseña (que se guarda cifrada con un hash; nunca en texto
            plano).
          </li>
          <li>
            <strong className="text-papel/90">Cuenta con Google:</strong> si ingresás con
            Google, recibimos de tu perfil tu email, tu nombre y tu foto, además de un
            identificador de Google que nos permite reconocerte en cada visita. No accedemos a
            tu contraseña de Google ni a ningún otro dato de tu cuenta.
          </li>
          <li>
            <strong className="text-papel/90">Tu actividad en el sitio:</strong> las reseñas,
            valoraciones, listas de seguimiento (watchlist), «me gusta» y directores que seguís.
          </li>
        </ul>
        <p>
          No recopilamos datos de navegación con fines publicitarios ni usamos herramientas de
          seguimiento de terceros.
        </p>
      </Seccion>

      <Seccion titulo="Cómo usamos tus datos">
        <p>
          Usamos tu información únicamente para operar el servicio: autenticarte, mostrar tu
          perfil y tu actividad, y asociar tus reseñas y listas con tu cuenta. No vendemos ni
          cedemos tus datos personales a terceros con fines comerciales.
        </p>
      </Seccion>

      <Seccion titulo="Cookies">
        <p>
          Usamos una única cookie técnica y esencial para mantener tu sesión iniciada de forma
          segura (guarda un token de sesión, no tu contraseña). Es <code>httpOnly</code>, no es
          accesible desde JavaScript y no se comparte con terceros. No usamos cookies de
          analítica ni de publicidad.
        </p>
      </Seccion>

      <Seccion titulo="Con quién compartimos datos">
        <p>
          Nos apoyamos en proveedores de infraestructura que procesan datos por cuenta nuestra,
          cada uno con su propia política de privacidad:
        </p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <strong className="text-papel/90">Supabase</strong> — alojamiento de la base de
            datos donde se guarda tu cuenta y tu actividad.
          </li>
          <li>
            <strong className="text-papel/90">Render</strong> — hosting de la aplicación.
          </li>
          <li>
            <strong className="text-papel/90">Google</strong> — solo si elegís iniciar sesión
            con Google, para verificar tu identidad.
          </li>
          <li>
            <strong className="text-papel/90">TMDB</strong> — proveedor de los datos de
            películas y personas que ves en el catálogo. No recibe información sobre vos.
          </li>
        </ul>
      </Seccion>

      <Seccion titulo="Cuánto tiempo conservamos tus datos">
        <p>
          Conservamos tu información mientras tu cuenta exista. Si la eliminás o nos pedís que
          la borremos, eliminamos tus datos personales y el contenido asociado.
        </p>
      </Seccion>

      <Seccion titulo="Tus derechos">
        <p>
          Podés solicitar el acceso, la corrección o la eliminación de tus datos personales, así
          como retirar tu consentimiento. Para ejercer cualquiera de estos derechos,
          escribinos a{' '}
          <a
            href={`mailto:${CONTACTO}`}
            className="text-papel underline underline-offset-4 hover:text-marca-cambio"
          >
            {CONTACTO}
          </a>
          .
        </p>
      </Seccion>

      <Seccion titulo="Menores de edad">
        <p>
          Raccord no está dirigido a menores de 13 años y no recopilamos deliberadamente sus
          datos. Si creés que un menor nos proporcionó información, escribinos y la
          eliminaremos.
        </p>
      </Seccion>

      <Seccion titulo="Cambios en esta política">
        <p>
          Podemos actualizar esta política ocasionalmente. Cuando lo hagamos, cambiaremos la
          fecha de «última actualización» que figura arriba.
        </p>
      </Seccion>

      <Seccion titulo="Contacto">
        <p>
          Ante cualquier duda sobre esta política o el tratamiento de tus datos, escribinos a{' '}
          <a
            href={`mailto:${CONTACTO}`}
            className="text-papel underline underline-offset-4 hover:text-marca-cambio"
          >
            {CONTACTO}
          </a>
          .
        </p>
      </Seccion>
    </div>
  );
}
