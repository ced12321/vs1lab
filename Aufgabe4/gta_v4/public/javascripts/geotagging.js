/* Dieses Skript wird ausgeführt, wenn der Browser index.html lädt. */

// Befehle werden sequenziell abgearbeitet ...

/**
 * "console.log" schreibt auf die Konsole des Browsers
 * Das Konsolenfenster muss im Browser explizit geöffnet werden.
 */
console.log("The script is going to start...");

class GeotTag {
    constructor(latitude,longitude,name,hashtag) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.name = name;
        this.hashtag = hashtag;
    }
}

// Es folgen einige Deklarationen, die aber noch nicht ausgeführt werden ...

// Hier wird die verwendete API für Geolocations gewählt
// Die folgende Deklaration ist ein 'Mockup', das immer funktioniert und eine fixe Position liefert.
GEOLOCATIONAPI = {
    getCurrentPosition: function (onsuccess) {
        onsuccess({
            "coords": {
                "latitude": 49.013790,
                "longitude": 8.390071,
                "altitude": null,
                "accuracy": 39,
                "altitudeAccuracy": null,
                "heading": null,
                "speed": null
            },
            "timestamp": 1540282332239
        });
    }
};

// Die echte API ist diese.
// Falls es damit Probleme gibt, kommentieren Sie die Zeile aus.
GEOLOCATIONAPI = navigator.geolocation;

/**
 * GeoTagApp Locator Modul
 */
var gtaLocator = (function GtaLocator(geoLocationApi) {

    // Private Member


    /**
     * Funktion spricht Geolocation API an.
     * Bei Erfolg Callback 'onsuccess' mit Position.
     * Bei Fehler Callback 'onerror' mit Meldung.
     * Callback Funktionen als Parameter übergeben.
     */
    var tryLocate = function (onsuccess, onerror) {
        if (geoLocationApi) {
            geoLocationApi.getCurrentPosition(onsuccess, function (error) {
                var msg;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "User denied the request for Geolocation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        msg = "The request to get user location timed out.";
                        break;
                    case error.UNKNOWN_ERROR:
                        msg = "An unknown error occurred.";
                        break;
                }
                onerror(msg);
            });
        } else {
            onerror("Geolocation is not supported by this browser.");
        }
    };

    // Auslesen Breitengrad aus der Position
    var getLatitude = function (position) {
        return position.coords.latitude;
    };

    // Auslesen Längengrad aus Position
    var getLongitude = function (position) {
        return position.coords.longitude;
    };
    var tryLocateError = function (msg) {
        alert(msg);
    }
    var tryLocateSuccess = function (position){
        let lat = getLatitude(position);
        let long = getLongitude(position);
        document.getElementById("lat").value = lat;
        document.getElementById("long").value = long;
        let taglist_json = document.getElementById("result-img").getAttribute("data-tags");
        let taglistParsed;

        if(taglist_json === "[]/") {
            taglistParsed = undefined;
        } else {
            taglistParsed = JSON.parse(taglist_json);
        }
        document.getElementById("result-img").src = getLocationMapSrc(lat,long,taglistParsed,14);
        console.log("sucess");
    }

    // Hier API Key eintragen
    var apiKey = "nyuizWiNOMu0WA3GZJDaFdE3j0tdXTFn";

    /**
     * Funktion erzeugt eine URL, die auf die Karte verweist.
     * Falls die Karte geladen werden soll, muss oben ein API Key angegeben
     * sein.
     *
     * lat, lon : aktuelle Koordinaten (hier zentriert die Karte)
     * tags : Array mit Geotag Objekten, das auch leer bleiben kann
     * zoom: Zoomfaktor der Karte
     */
    var getLocationMapSrc = function (lat, lon, tags, zoom) {
        zoom = typeof zoom !== 'undefined' ? zoom : 10;

        if (apiKey === "YOUR_API_KEY_HERE") {
            console.log("No API key provided.");
            return "images/mapview.jpg";
        }

        var tagList = "&pois=You," + lat + "," + lon;
        if (tags !== undefined) tags.forEach(function (tag) {
            tagList += "|" + tag.name + "," + tag.latitude + "," + tag.longitude;
        });

        var urlString = "https://www.mapquestapi.com/staticmap/v4/getmap?key=" +
            apiKey + "&size=600,400&zoom=" + zoom + "&center=" + lat + "," + lon + "&" + tagList;

        console.log("Generated Maps Url: " + urlString);
        return urlString;
    };

    return { // Start öffentlicher Teil des Moduls ...

        // Public Member

        readme: "Dieses Objekt enthält 'öffentliche' Teile des Moduls.",

        updateLocation: function () {

            if(document.getElementById("lat").value === "" || document.getElementById("long").value === "") {
                tryLocate(tryLocateSuccess, tryLocateError);
            } else {
                let taglist_json = document.getElementById("result-img").getAttribute("data-tags");
                let taglistParsed;
                if(taglist_json === "[]/") {
                    taglistParsed = undefined;
                } else {
                    taglistParsed = JSON.parse(taglist_json);
                }
                let lat = document.getElementById("lat").value;
                let long = document.getElementById("long").value;
                document.getElementById("result-img").src = getLocationMapSrc(lat,long,taglistParsed,14);
            }
        }


    }
        ; // ... Ende öffentlicher Teil
})(GEOLOCATIONAPI);

function onClickTagging(event) {
    event.preventDefault();
    const xhr = new XMLHttpRequest();
    const lat = document.getElementById('lat').value;
    const long = document.getElementById('long').value;
    const name = document.getElementById('name').value;
    const tag = document.getElementById('tag').value;
    const geoTag = new GeotTag(lat,long,name,tag);

    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.open('POST','/tagging');
    xhr.send(JSON.stringify(geoTag));
    xhr.onload = function() {
        if(xhr.readyState === 4 && xhr.status === 200) {
            const content = name + '(' + lat + ', ' + long + ')' + tag;
            const node = document.createElement('li');
            const textNode = document.createTextNode(content);
            node.appendChild(textNode);
            document.getElementById('result').appendChild(node);
        } else {
            console.log("Error: adding to list failed");
        }
    }
}

function onClickDiscovery(event) {
    event.preventDefault();
    const xhr = new XMLHttpRequest();
    const searchTerm = document.getElementById("searchterm").value;

    xhr.open('GET', '/geotags/name=' + searchTerm);
    if(xhr.readyState === 4 && xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        const result = document.getElementById('result');
        result.innerHTML = "";
        data.forEach(function (tag) {
            const content = tag.name + '(' + tag.latitude + ', ' + tag.longitude + ')' + tag.tag;
            const node = document.createElement('li');
            const textNode = document.createTextNode(content);
            node.appendChild(textNode);
            result.appendChild(node);
        });
    } else {
        console.log("Error: search failed");
    }
    xhr.send();
    xhr.onload = function () {
    }
}

document.getElementById('submitGeoTag').addEventListener('click', onClickTagging);
document.getElementById('submitSearchTerm').addEventListener('click', onClickDiscovery);


/**
 * $(function(){...}) wartet, bis die Seite komplett geladen wurde. Dann wird die
 * angegebene Funktion aufgerufen. An dieser Stelle beginnt die eigentliche Arbeit
 * des Skripts.
 */
$(function () {
    gtaLocator.updateLocation();
});

