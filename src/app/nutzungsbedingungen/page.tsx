import { LegalPage, Todo } from '@/components/legal-page'

export const metadata = {
  title: 'Nutzungsbedingungen – Linde',
  description: 'Die Regeln für die Nutzung von Linde.',
}

export default function NutzungsbedingungenPage() {
  return (
    <LegalPage title="Nutzungsbedingungen" updated="23. September 2026">
      <p>
        Diese Bedingungen gelten zwischen Ihnen und <Todo>Name der verantwortlichen Stelle</Todo>{' '}
        („wir“) für die Nutzung von Linde. Bitte lesen Sie sie, bevor Sie ein Konto anlegen.
      </p>

      <h2>1. Was Linde ist – und was nicht</h2>
      <p>
        Linde hilft älteren Menschen und Studierenden, einander in der Nachbarschaft zu finden, um
        gemeinsam Zeit zu verbringen, Deutsch zu üben und sich auszutauschen.
      </p>
      <p>
        Linde ist <strong>keine Vermittlung von Pflege, Betreuung oder bezahlter Arbeit</strong>,
        kein Notdienst und keine Beratungsstelle. Wir stellen nur den Kontakt her. Was Sie danach
        miteinander vereinbaren, vereinbaren Sie unmittelbar untereinander – wir sind daran nicht
        beteiligt und werden nicht Vertragspartei.
      </p>
      <p>
        In dringenden Fällen wenden Sie sich bitte an den Notruf <strong>112</strong> und nicht an
        Linde.
      </p>

      <h2>2. Wer Linde nutzen darf</h2>
      <ul>
        <li>Sie müssen mindestens 16 Jahre alt sein.</li>
        <li>Sie legen höchstens ein Konto an und geben zutreffende Angaben zu Ihrer Person.</li>
        <li>Sie nutzen Linde für sich selbst, nicht im Auftrag eines Unternehmens.</li>
      </ul>

      <h2>3. Ihr Angebot und Ihr Profil</h2>
      <p>
        Sie können ein Angebot veröffentlichen, jederzeit ändern und jederzeit wieder löschen.
        Solange es veröffentlicht ist, können angemeldete Nutzerinnen und Nutzer der jeweils anderen
        Gruppe es sehen. Sie behalten die Rechte an Ihren Texten und Ihrem Foto; Sie erlauben uns
        lediglich, sie innerhalb der App anzuzeigen, damit der Dienst funktionieren kann.
      </p>
      <p>
        Laden Sie nur Fotos hoch, die Sie selbst zeigen und an denen Sie die Rechte haben.
      </p>

      <h2>4. Wie wir miteinander umgehen</h2>
      <p>Nicht erlaubt sind insbesondere:</p>
      <ul>
        <li>Beleidigungen, Bedrohungen, Diskriminierung und Belästigung</li>
        <li>Werbung, Verkauf, Spenden- oder Geldanfragen jeder Art</li>
        <li>
          das Erfragen von Bankdaten, Passwörtern, Ausweisdokumenten oder Vollmachten, und jeder
          Versuch, jemanden zu einer Zahlung zu bewegen
        </li>
        <li>falsche Angaben zur eigenen Person oder das Auftreten unter fremdem Namen</li>
        <li>das Weitergeben fremder Daten oder Nachrichten an Dritte</li>
      </ul>
      <p>
        Ein Hinweis, der uns besonders wichtig ist: <strong>Seriöse Anfragen fragen nie nach Geld
        oder Bankdaten.</strong> Wenn Ihnen etwas merkwürdig vorkommt, brechen Sie das Gespräch ab
        und melden Sie es uns unter <Todo>Kontakt-E-Mail-Adresse</Todo>.
      </p>

      <h2>5. Treffen finden außerhalb der App statt</h2>
      <p>
        Termine vereinbaren Sie im Chat, das Treffen selbst findet ohne uns statt. Wir überprüfen
        die Identität der Nutzerinnen und Nutzer nicht und führen keine Zuverlässigkeitsprüfung
        durch. Bitte gehen Sie mit derselben Vorsicht vor wie bei jedem anderen Kennenlernen:
        treffen Sie sich beim ersten Mal an einem öffentlichen Ort, und sagen Sie jemandem
        Bescheid, wo Sie sind.
      </p>

      <h2>6. Sperrung und Kündigung</h2>
      <p>
        Sie können Ihr Konto jederzeit und ohne Angabe von Gründen löschen. Wir können Konten
        sperren oder löschen, wenn gegen diese Bedingungen verstoßen wird oder wenn eine Nutzung
        andere gefährdet. Wo es möglich und sinnvoll ist, sagen wir vorher Bescheid.
      </p>

      <h2>7. Haftung</h2>
      <p>
        Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von
        Leben, Körper oder Gesundheit. Bei einfacher Fahrlässigkeit haften wir nur, wenn eine
        Pflicht verletzt wird, auf deren Erfüllung Sie vertrauen dürfen und die für die
        Durchführung des Vertrags wesentlich ist (Kardinalpflicht), und dann begrenzt auf den
        vorhersehbaren, vertragstypischen Schaden. Die Haftung nach dem Produkthaftungsgesetz
        bleibt unberührt.
      </p>
      <p>
        Für Inhalte, die Nutzerinnen und Nutzer einstellen, und für das Verhalten bei Treffen
        übernehmen wir keine Verantwortung. Linde ist ein kostenloses Angebot; einen Anspruch auf
        ständige Verfügbarkeit gibt es nicht.
      </p>

      <h2>8. Änderungen</h2>
      <p>
        Wir dürfen diese Bedingungen ändern, etwa wenn sich die App weiterentwickelt. Über
        wesentliche Änderungen informieren wir Sie vorher per E-Mail. Widersprechen Sie nicht oder
        nutzen Sie Linde weiter, gelten die neuen Bedingungen; andernfalls können Sie Ihr Konto
        löschen.
      </p>

      <h2>9. Schlussbestimmungen</h2>
      <p>
        Es gilt deutsches Recht. Sind Sie Verbraucherin oder Verbraucher, bleiben die zwingenden
        Schutzvorschriften Ihres Aufenthaltsstaates unberührt. Wir sind nicht verpflichtet und
        nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
        teilzunehmen.
      </p>
      <p>
        Wie wir mit Ihren Daten umgehen, steht in der{' '}
        <a href="/datenschutz">Datenschutzerklärung</a>.
      </p>
    </LegalPage>
  )
}
