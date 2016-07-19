# ffffng – Freifunk Knotenverwaltung


## Motivation / Disclaimer

TODO


## Features

TODO


## Screenshots

### Startseite der Knotenverwaltung

![](doc/start.png?raw=true "Startseite der Knotenverwaltung")


### Formular zur Erfassung der Knotendaten

![](doc/knotendaten.png?raw=true "Formular zur Erfassung der Knotendaten")


### Option zum automatischen Versand von Monitoring-E-Mails

![](doc/monitoring.png?raw=true "Option zum automatischen Versand von Monitoring-E-Mails")


### Bestätigungsseite nach dem Speichern

![](doc/geschafft.png?raw=true "Bestätigungsseite nach dem Speichern")


### Statistiken im Admin-Panel

![](doc/admin-statistik.png?raw=true "Statistiken im Admin-Panel")


### Knotenübersicht im Admin-Panel

![](doc/admin-knoten.png?raw=true "Knotenübersicht im Admin-Panel")


## Installation / Konfiguration

TODO


## Administration

Das Admin-Panel ist dann entsprechend erreichbar unter: [https://formular.musterstadt.freifunk.net/internal/admin]().
(Die Domain muss natürlich angepasst werden.)

Das Admin-Panel besteht aus folgenden Bereichen:

* Dashboard / Statistics: Übersichtsseite.
* Nodes: Liste aller in der Knotenverwaltung registrierten Knoten.
* Monitoring: Liste aller aus der Karte bekannten Knoten inkl. Online- und Monitoring-Status.
* Mail-Queue: Liste der als nächste zu versendenden E-Mails. E-Mails werden bis zu 5 mal versucht zu versenden. Sollte
  der Versand dann immer noch nicht geklappt haben, können sie hier gelöscht oder resettet werden (werden dann erneut
  versendet).
* Background-Jobs: Übersicht über alle in der Knotenverwaltung laufenden Background-Jobs. Diese können dort bei Bedarf
  auch manuell gestartet, aktiviert und deaktiviert werden. **ACHTUNG**, das Deaktivieren von Jobs kann dazu führen,
  dass die Knotenverwaltung nicht mehr korrekt arbeitet. Die Jobs bleiben nur bis zum nächsten Neustart des Servers
  deaktiviert.
* Logs: Verlinkung auf eine Übersicht der Knotenverwaltungs-Logs. Diese ist nicht wirklich stabil und kann bei großen
  Log-Dateien schnell den Browser überfordern.


## gluon Config-Mode

Soll das Formular zum Anlegen neuer Knoten im gluon Config-Mode verlinkt werden, so bietet es sich an, die
Übersetzungsdateien der Firmware unter `i18n/` so ähnlich wie hier unten anzupassen:

```
msgid "gluon-config-mode:pubkey"
msgstr ""
...
"<a href=\"https://formular.musterstadt.freifunk.net/#/new?hostname=<%=hostname%>&key=<%=pubkey%>&mac=<%= sysconfig.primary_mac %>\" target=\"_blank\">https://formular.musterstadt.freifunk.net/</a> ein.</p>"
"<div class=\"the-key\">"
" # <%= hostname %>"
" <br/>"
"<%= pubkey %>"
...
"</div>"
```

Auf diese Weise landet der Nutzer direkt im teilweise vorausgefüllten Formular und muss nicht mehr den Knotennamen,
fastd-Key und die MAC-Adresse angeben.


## Entwicklung

### Abhängigkeiten

* node.js + NPM
* compass (Installation z. B. via Ruby's `gem`)
* grunt (Installation z. B. via `npm install grunt-cli`)
* ggf. bower (Installation z. B. via `npm install bower`)


### Build

`grunt clean build`

Der Output landet dann unter `dist/`.


### Server starten

1. Zunächst eine `config.json` anlegen wie oben unter "Installation / Konfiguration" beschrieben.
2. `node server/main.js -c config.json`

Der Server ist dann erreichbar unter [http://localhost:8080]().


### Life-Reload vom Client

`grunt serve`

Der Client ist dann erreichbar via [http://localhost:9000](), erwartet aber, dass der Server für die REST-API auch läuft
(s. o.) und auf Port `8080` erreichbar ist.


### Publishen auf npmjs.com

Geht nur, wenn man die Berechtigungen für das Package auf npmjs.com hat.

Zunächst sicherstellen, dass in der `package.json` die korrekte neue Versionsnummer eingetragen und committed ist,
dann einfach `./publish.sh` aufrufen.
