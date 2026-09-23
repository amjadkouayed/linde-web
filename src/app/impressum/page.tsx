import { LegalPage, Todo } from '@/components/legal-page'

export const metadata = {
  title: 'Impressum – Linde',
  description: 'Anbieterkennzeichnung nach § 5 DDG.',
}

/**
 * Legally required in Germany for any website that is not purely private —
 * § 5 DDG (the former § 5 TMG). Missing or incomplete it is abmahnfähig, so the
 * placeholders are rendered visibly rather than hidden in a comment.
 */
export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" updated="23. September 2026">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        Amjad Kouayed
        <br />
        <Todo>Straße und Hausnummer</Todo>
        <br />
        <Todo>Postleitzahl und Ort</Todo>
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href="mailto:amjad.ali.kouayed@gmail.com">amjad.ali.kouayed@gmail.com</a>
      </p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        Amjad Kouayed, Anschrift wie oben.
      </p>

      <h2>Art des Angebots</h2>
      <p>
        Linde ist ein nicht-kommerzielles Projekt im Rahmen der UNESCO-Projekttage. Es wird nicht
        gewinnorientiert betrieben, es werden keine Entgelte erhoben und keine Werbung ausgespielt.
      </p>

      <h2>Streitbeilegung</h2>
      <p>
        Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Verwendete Daten und Schriften</h2>
      <p>
        Die Zuordnung von Postleitzahlen zu Orten und Gebietsmittelpunkten stammt von{' '}
        <a href="https://www.geonames.org/" rel="noreferrer noopener" target="_blank">
          GeoNames
        </a>{' '}
        und steht unter der Lizenz{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          rel="noreferrer noopener"
          target="_blank"
        >
          CC BY 4.0
        </a>
        . Die Nennung ist Bedingung dieser Lizenz.
      </p>
      <p>
        Als Schriften verwenden wir Bitter und Karla, beide unter der SIL Open Font License.
      </p>

      <h2>Haftung für Inhalte und Links</h2>
      <p>
        Für eigene Inhalte sind wir nach den allgemeinen Gesetzen verantwortlich. Für von
        Nutzerinnen und Nutzern eingestellte Inhalte sind wir nicht verantwortlich; sobald uns eine
        konkrete Rechtsverletzung bekannt wird, entfernen wir den Inhalt umgehend. Für Inhalte
        verlinkter externer Seiten ist deren jeweiliger Anbieter verantwortlich.
      </p>
    </LegalPage>
  )
}
