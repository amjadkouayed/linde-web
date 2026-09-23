import { LegalPage, Todo } from '@/components/legal-page'

export const metadata = {
  title: 'Datenschutzerklärung – Linde',
  description: 'Welche Daten Linde speichert, warum, wie lange und welche Rechte Sie haben.',
}

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung" updated="23. September 2026">
      <p>
        Linde verbindet ältere Menschen mit Studierenden in der Nachbarschaft. Dabei entstehen
        persönliche Daten – auch Ihre ungefähre Wohngegend. Diese Erklärung sagt in einfachen
        Worten, was wir speichern, warum, wie lange, und was Sie jederzeit verlangen können.
      </p>

      <h2>1. Wer ist verantwortlich?</h2>
      <p>
        Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        <br />
        Amjad Kouayed, <Todo>Anschrift wie im Impressum</Todo>
        <br />
        E-Mail: <a href="mailto:amjad.ali.kouayed@gmail.com">amjad.ali.kouayed@gmail.com</a>
      </p>
      <p>
        Einen Datenschutzbeauftragten haben wir nicht benannt; dazu sind wir nach Art. 37 DSGVO
        nicht verpflichtet.
      </p>

      <h2>2. Welche Daten wir speichern</h2>
      <p>Wir speichern ausschließlich das, was die App zum Funktionieren braucht:</p>
      <ul>
        <li>
          <strong>Ihre E-Mail-Adresse.</strong> Sie ist Ihr Zugang. Wir schicken Ihnen dorthin
          einen Anmeldecode. Ein Passwort gibt es nicht.
        </li>
        <li>
          <strong>Ihr Profil:</strong> Name, Geburtsjahr, ob Sie Senior:in oder Studierende:r sind,
          bei Senior:innen zusätzlich die Angabe „Rentner“, „Rentnerin“ oder „noch berufstätig“,
          bei Studierenden die Fachrichtung, außerdem ein freier Text über Sie, Ihre Interessen und
          – wenn Sie eines hochladen – ein Foto.
        </li>
        <li>
          <strong>Ihre Postleitzahl und der dazugehörige Ortsname.</strong> Mehr zum Standort unter
          Punkt 3.
        </li>
        <li>
          <strong>Ihr Angebot:</strong> Verfügbarkeit und Beschreibung, und ob es veröffentlicht
          ist.
        </li>
        <li>
          <strong>Kontakte und Nachrichten:</strong> wen Sie angefragt haben, ob angenommen oder
          abgelehnt wurde, Ihre erste Nachricht an diese Person sowie die Nachrichten im Chat.
        </li>
        <li>
          <strong>Aufrufe Ihres Angebots:</strong> wir zählen, wie viele verschiedene Personen Ihr
          Angebot an einem Tag angesehen haben, damit Sie sehen, ob es wahrgenommen wird.
        </li>
      </ul>
      <p>
        Wir speichern <strong>keine</strong> Straße, keine Hausnummer, keine Telefonnummer, keine
        Zahlungsdaten und keine Standortdaten aus Ihrem Gerät (kein GPS).
      </p>

      <h2>3. Standort: nur die Postleitzahl</h2>
      <p>
        Damit die Suche „in der Nähe“ funktionieren kann, brauchen wir einen ungefähren Ort. Wir
        fragen deshalb <strong>nur Ihre Postleitzahl</strong> ab – nie Ihre Adresse.
      </p>
      <p>
        Intern rechnen wir die Postleitzahl in einen einzigen Punkt um: den{' '}
        <strong>Mittelpunkt des gesamten Postleitzahlgebiets</strong>. Dieser Punkt ist für alle
        Menschen in Ihrer Postleitzahl identisch und hat mit Ihrer Wohnung nichts zu tun. Andere
        Nutzerinnen und Nutzer sehen nie eine Position, sondern immer nur eine gerundete Entfernung
        („ca. 3 km“).
      </p>
      <p>
        Das ist eine bewusste Entscheidung: Eine Umkreissuche lässt sich sonst von mehreren Punkten
        aus abfragen, bis sich daraus ein Wohnort ergibt. Weil bei uns ausschließlich der
        Gebietsmittelpunkt gespeichert ist, lässt sich damit höchstens das Postleitzahlgebiet
        ermitteln, das Sie ohnehin selbst angegeben haben.
      </p>

      <h2>4. Auf welcher Rechtsgrundlage</h2>
      <ul>
        <li>
          <strong>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</strong> für Konto, Profil,
          Angebot, Kontaktanfragen und Nachrichten. Ohne diese Daten kann die App ihren Zweck nicht
          erfüllen.
        </li>
        <li>
          <strong>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</strong> für die Zählung der
          Angebotsaufrufe sowie für Protokolle, die Missbrauch und Angriffe erkennbar machen. Unser
          Interesse ist ein funktionierender, sicherer Dienst; wir werten diese Daten nicht
          personenbezogen aus und erstellen keine Profile.
        </li>
        <li>
          <strong>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</strong> für das Profilfoto: Sie
          entscheiden, ob Sie eines hochladen, und können es jederzeit wieder löschen.
        </li>
      </ul>

      <h2>5. Wer die Daten sehen kann</h2>
      <p>
        Ihr Profil und Ihr Angebot sind nur für angemeldete Nutzerinnen und Nutzer der jeweils
        anderen Gruppe sichtbar, und nur, solange Sie Ihr Angebot veröffentlicht haben. Ihre
        Nachrichten kann ausschließlich die Person lesen, mit der Sie schreiben. Das ist nicht nur
        eine Regel in der Oberfläche, sondern in der Datenbank selbst durchgesetzt.
      </p>
      <p>Technische Dienstleister (Auftragsverarbeiter nach Art. 28 DSGVO):</p>
      <ul>
        <li>
          <strong>Supabase</strong> – Datenbank, Anmeldung, Dateispeicher und Versand der
          Anmeldecodes. Die Datenbank dieses Projekts liegt in der{' '}
          <strong>EU (Region Irland)</strong>.
        </li>
        <li>
          <strong>Vercel</strong> – Betrieb der Website. Dabei fallen technisch notwendige
          Verbindungsdaten wie Ihre IP-Adresse an.
        </li>
      </ul>
      <p>
        Beide Anbieter gehören zu US-Unternehmen. Soweit dabei Daten in die USA übertragen werden,
        stützt sich das auf die Standardvertragsklauseln der EU-Kommission nach Art. 46 Abs. 2
        lit. c DSGVO. Wir verkaufen keine Daten und geben sie nicht zu Werbezwecken weiter.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Wir setzen ausschließlich ein technisch notwendiges Cookie, das Sie angemeldet hält. Es ist
        nach § 25 Abs. 2 TDDDG einwilligungsfrei, weshalb es bei uns kein Cookie-Banner gibt. Wir
        verwenden <strong>kein</strong> Tracking, keine Werbenetzwerke und keine Analysedienste von
        Dritten.
      </p>

      <h2>7. Wie lange wir speichern</h2>
      <ul>
        <li>Profil, Angebot und Kontakte: solange Ihr Konto besteht.</li>
        <li>
          Nachrichten: solange der Kontakt besteht. Löschen Sie Ihr Konto, werden auch Ihre
          Nachrichten gelöscht; bei Ihrem Gegenüber verschwindet damit der Gesprächsverlauf.
        </li>
        <li>Aufrufe von Angeboten: 90 Tage, danach werden sie gelöscht.</li>
        <li>
          Anmeldecodes: eine Stunde, danach verfallen sie automatisch.
        </li>
      </ul>
      <p>
        Wenn Sie Ihr Konto löschen, löschen wir die damit verbundenen Daten vollständig. Eine
        Kopie bleibt höchstens kurzzeitig in technischen Sicherungskopien erhalten und wird mit
        deren Ablauf ebenfalls gelöscht.
      </p>

      <h2>8. Ihre Rechte</h2>
      <p>Sie haben jederzeit das Recht auf:</p>
      <ul>
        <li>Auskunft über Ihre Daten (Art. 15 DSGVO)</li>
        <li>Berichtigung falscher Daten (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Übertragung Ihrer Daten in einem gängigen Format (Art. 20 DSGVO)</li>
        <li>
          Widerspruch gegen Verarbeitungen, die auf einem berechtigten Interesse beruhen (Art. 21
          DSGVO)
        </li>
        <li>Widerruf einer erteilten Einwilligung, mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
      </ul>
      <p>
        Vieles davon erledigen Sie direkt in der App: Profil und Angebot können Sie bearbeiten oder
        löschen. Für alles Weitere schreiben Sie an <a href="mailto:amjad.ali.kouayed@gmail.com">amjad.ali.kouayed@gmail.com</a>. Wir
        antworten innerhalb eines Monats.
      </p>
      <p>
        Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO),
        zum Beispiel bei der für uns zuständigen Behörde:{' '}
        <Todo>zuständige Landesdatenschutzbehörde</Todo>.
      </p>

      <h2>9. Mindestalter</h2>
      <p>
        Linde ist erst ab 16 Jahren nutzbar. Das entspricht der Altersgrenze, ab der Sie nach
        § 25 Abs. 1 TDDDG und Art. 8 DSGVO in Deutschland selbst wirksam einwilligen können.
      </p>

      <h2>10. Sicherheit</h2>
      <p>
        Die Verbindung zur App ist verschlüsselt (HTTPS). Der Zugriff auf Daten wird in der
        Datenbank selbst geprüft, nicht erst in der Oberfläche: Auch wer die Schnittstelle direkt
        anspricht, bekommt ausschließlich die Daten, die er sehen darf.
      </p>

      <h2>11. Änderungen</h2>
      <p>
        Ändert sich die App, ändern wir auch diese Erklärung. Das Datum oben zeigt den aktuellen
        Stand.
      </p>
    </LegalPage>
  )
}
