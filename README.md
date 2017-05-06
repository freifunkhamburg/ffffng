# ffffng – Freifunk Knotenverwaltung


## Disclaimer

**ACHTUNG:** Die Knotenverwaltung legt aktuell die Daten zentral ab. Im Freifunk-Sinne ist eine dezentrale Datenhaltung
auf den Knoten sinnvoller, daher führt diese Knotenverwaltung bitte *nicht* neu in Freifunk-Communities ein, in denen
die Knotendaten bereits auf den Knoten hinterlegt sind. 


## Beschreibung / Motivation

Die Freifunk Knotenverwaltung ist in Hamburg ursprünglich entstanden (damals noch `ffff`), um eine Registrierung von
`fastd`-Keys neuer Knoten zu ermöglichen. Dabei wurden auch die MAC-Adresse, der Knotenname und die GPS-Koordinaten
erfasst. Die Idee war die Verwendung in der Knotenkarte. Da der Config-Mode von gluon keinen Internet-Zugang bietet,
wurde die Erfassung der Koordinaten ausgelagert, um zunächst die Koordinaten in einem neuen Tab aus der Karte kopieren
und später mit `ffffng` die Karte zur Positionierung direkt in die Knotenverwaltung einbetten zu können.

Zusätzlich werden Kontaktdaten erfasst (Pflichtfelder), um im Notfall die Knotenbetreiber erreichen zu können. Die
Kontaktdaten sind nicht öffentlich einsehbar.
 
Mit der Version `0.9.0` sind die neue Monitoring-Funktion sowie das Admin-Panel hinzugekommen.


## Features

* Anlegen, Bearbeiten und Löschen von Knoten.
* Auswahl der Koordinaten über eingebettete Karte.
* Automatische Benachrichtigung, wenn ein Knoten zu lange offline ist.
* Admin-Panel mit Statistiken, Suchfunktion, ...


## Anti-Features

* Zentrale Ablage der Daten auf einem Server statt auf den Knoten selber.
* Migration der Daten zurück auf die Knoten oder in andere Systeme bisher nicht möglich. D. h. sobald einmal diese
  Knotenverwaltung verwendet wird, ist es nicht einfach möglich, diese wieder loszuwerden.
* Angepasste Version des Karten-Backends für die Knotenkarte (meshviewer o.ä.) nötig.


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

### Vorbereitungen

Verzeichnisstruktur für die Installation anlegen (im Weiteren `$FFFFNG_HOME`). Z. B.:

```
mkdir -p $FFFFNG_HOME
mkdir -p $FFFFNG_HOME/fastdkeys
mkdir -p $FFFFNG_HOME/logs
```

Nicht vergessen: Berechtigungen anpassen für den User unter dem der Server läuft.


### Installation

Abhängigkeiten installieren:

* node.js + NPM
* nginx o.ä. für SSL-Offloading und Proxy (hier nicht weiter beschrieben)

Danach die Knotenverwaltung via `npm` installieren:

```
cd $FFFFNG_HOME
npm install ffffng
```

### Konfiguration

```
cp $FFFFNG_HOME/node_modules/ffffng/config.json.example $FFFFNG_HOME/config.json
```

Dann die `config.json` anpassen nach belieben. Es gibt die folgenden Konfigurations-Optionen:

* **`server.baseUrl`** Basis-URL unter der die Knotenverwaltung erreichbar ist, z. B.:
  `"https://formular.musterstadt.freifunk.net"` oder `"https://musterstadt.freifunk.net/formular"` 
* **`server.port`** Port unter dem der Server lokal läuft, z. B.: `8080`

* **`server.databaseFile`** Pfad zur Datenbank-Datei, z. B.: `"$FFFFNG_HOME/ffffng.sqlite"`
* **`server.peersPath`** Verzeichnis unter dem die `fastd` Key-Files angelegt werden, z. B.: `"$FFFFNG_HOME/fastdkeys"`

* **`server.logging.directory`** Verzeichnis unter dem Log-Files abgelegt werden, z. B.: `"$FFFFNG_HOME/logs"`
* **`server.logging.debug`** Gibt an, ob Debug-Output geloggt werden soll (Achtung, viel!), z. B.: `false`
* **`server.logging.profile`** Gibt an, ob Profiling-Output geloggt werden soll (Achtung, viel!), z. B.: `false`
* **`server.logging.logRequests`** Gib an, ob HTTP-Requests geloggt werden sollen (Achtung, Datenschutz!), z. B.: `false`

* **`server.internal.active`** Gibt an, ob interne URLs, wie Admin-Panel und Logging-Interface, erreichbar sein sollen,
  z. B.: `true`
* **`server.internal.user`** Benutzername für den Login beim Aufrufen interner URLs, z. B.: `"admin"`
* **`server.internal.password`** Das zugehörige Passwort, z. B.: `"secret"`

* **`server.email.from`** Absender für versendete E-Mails, z. B.: `"Freifunk Knotenformular <no-reply@musterstadt.freifunk.net>"`
* **`server.email.smtp`** Konfiguration des SMTP-Servers für den E-Mail-Versand entsprechend der Dokumentation unter
  [https://nodemailer.com/2-0-0-beta/setup-smtp/](https://nodemailer.com/2-0-0-beta/setup-smtp/), z. B.:

```
{
    "server": {
        ...
        
        "email": {
            ...
            
            "smtp": {
                "host": "mail.example.com",
                "port": 465,
                "secure": true,
                "auth": {
                    "user": "user@example.com",
                    "pass": "pass"
                }
            }
        }
        
        ...
    }
    ...
}
```

* **`server.map.nodesJsonUrl`** URL der `nodes.json` des meshviewers (kann eine URL oder eine Liste von URLs sein), z. B.: `["http://musterstadt.freifunk.net/nodes.json"]`

* **`client.community.name`** Name der Freifunk-Community, z. B.: `"Freifunk Musterstadt"`
* **`client.community.domain`** Domain der Freifunk-Community, z. B.: `"musterstadt.freifunk.net"`
* **`client.community.contactEmail`** Kontakt-E-Mail-Adresse der Freifunk-Community, z. B.: `"kontakt@musterstadt.freifunk.net"`

* **`client.map.mapUrl`** URL der Knotenkarte, z. B.: `"http://map.musterstadt.freifunk.net"`

* **`client.monitoring.enabled`** Gibt an, ob die Nutzer Monitoring für ihre Knoten aktivieren können sollen, z. B.: `true`

* **`client.coordsSelector.lat`** Breitengrad auf den die Karte zur Auswahl der Koordinaten zentriert werden soll, z. B.: `53.565278`
* **`client.coordsSelector.lng`** Längengrad auf den die Karte zur Auswahl der Koordinaten zentriert werden soll, z. B.: `10.001389`
* **`client.coordsSelector.defaultZoom`** Default-Zoom-Level für die Karte, z. B.: `10`
* **`client.coordsSelector.layers`** Die Layers für die Karte. Hier können einer oder mehrere Tile-Provider eingetragen
  werden. Eine Übersicht über mögliche Kandidaten gibt es z. B. unter
  [http://leaflet-extras.github.io/leaflet-providers/preview/index.html](http://leaflet-extras.github.io/leaflet-providers/preview/index.html).
  Die Tile-Provider können dann z. B. wie folgt eingetragen werden (erlaubt ist alles, was von
  [https://github.com/tombatossals/angular-leaflet-directive](https://github.com/tombatossals/angular-leaflet-directive)
  als Konfiguration für `baseLayers` verwendet werden kann):
  
```
{
    ...

    "client": {
        ...

        "coordsSelector": {
            ...

            "layers": {
                "example-provider": {
                    "name": "Beispiel Tile Server",
                    "url": "https:///tiles{s}.example.com/{z}/{x}/{y}.png",
                    "type": "xyz",
                    "layerOptions": {
                        "maxZoom": 18,
                        "subdomains": "1234",
                        "attribution": "&copy; Beispiel Tile Provider und OSM"
                    }
                },
                "another-provider": {
                    "name": "Noch ein Tile Server",
                    "url": "https://more-tiles-{s}.example.com/foo/{z}/{x}/{y}.png",
                    "type": "xyz",
                    "layerOptions": {
                        "maxZoom": 18,
                        "subdomains": "abcd",
                        "attribution": "Attribution goes here"
                    }
                }
                
                ...
            }
            
            ...
        }
        
        ...
    }
    
    ...
}
```

* **`client.otherCommunityInfo.showInfo`** Gibt an, ob für Knoten außerhalb der Community-Grenzen ein Info-Dialog
  angezeigt werden soll, z. B.: `true`
* **`client.otherCommunityInfo.showBorderForDebugging`** Gibt an, ob in der Karte die Community-Grenze (zum Debugging)
  angezeigt werden soll, z. B.: `false`
* **`client.otherCommunityInfo.localCommunityPolygon`** Polygon für die Community-Grenze (Tipp: Koordinaten durch Klicken
  in der Karte bestimmen und kopieren), z. B.:

```
{
    ...
    "client": {
        ...
        "otherCommunityInfo": {
            ...
            "localCommunityPolygon": [{
                "lat": 53.63975308945899, "lng": 9.764785766601562
            }, {
                "lat": 53.578646152866504, "lng": 10.208358764648438
            }, {
                "lat": 53.49039461941655, "lng": 9.795341491699219
            }, {
                "lat": 53.60921067445695, "lng": 9.737663269042969
            }]
        }
    }
}
```


### Starten des Servers

Je nach System ggf. z. B. ein Init-Skript oder eine systemd-Unit schreiben. Dabei sollte der Server vorzugsweise nicht
als root laufen. Generell lässt sich der Server wie folgt starten:

```
$FFFFNG_HOME/node_modules/.bin/ffffng -c $FFFFNG_HOME/config.json
```

Der Server ist dann via HTTP unter dem in der `config.json` konfigurierten Port erreichbar. Für vhost-Konfiguration und
HTTPs biete es sich an, nginx o.ä. als Proxy zu verwenden.


### Synchronisierung der fastd-Keys

Die Synchronisierung und Verteilung der fastd-Keys auf die Gateways lässt sich z. B. via git und cron-Jobs realisieren.
Details hierzu auf Anfrage.


### Karten-Backend

Für die Verwendung von meshviewer o.ä. muss das jeweilige Kartenbackend angepasst werden, sodass die Knotendaten aus
dem Formular zusätzlich zu denen aus alfred verwendet werden. Details hierzu auf Anfrage.


## Administration

Das Admin-Panel ist dann entsprechend erreichbar unter: 
[https://formular.musterstadt.freifunk.net/internal/admin](https://formular.musterstadt.freifunk.net/internal/admin).
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

Der Server ist dann erreichbar unter [http://localhost:8080](http://localhost:8080).


### Life-Reload vom Client

`grunt serve`

Der Client ist dann erreichbar via [http://localhost:9000](http://localhost:9000), erwartet aber, dass der Server für
die REST-API auch läuft (s. o.) und auf Port `8080` erreichbar ist.


### Publishen auf npmjs.com

Geht nur, wenn man die Berechtigungen für das Package auf npmjs.com hat.

Zunächst sicherstellen, dass in der `package.json` die korrekte neue Versionsnummer eingetragen und committed ist,
dann einfach `./publish.sh` aufrufen.
