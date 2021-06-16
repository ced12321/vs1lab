/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

const standardRadius = 100;
const standardLong = 49.01374065847857;
const standardLat = 8.404893914899443;

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app;
app = express();
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Setze ejs als View Engine
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

app.use(express.static('public'));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

class GeoTag {
    constructor(latitude,longitude,name,hashtag) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.name = name;
        this.hashtag = hashtag;
    }
}

/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

let inMemory = (function() {
    let geoTags = [];

    return {
        radiusSearchGeoTags : function (radius, lat, long) {
            const maxLat = lat + radius;
            const minLong = long - radius;
            const maxLong = long + radius;
            const minLat = lat - radius;
            let results = [];
            geoTags.forEach(function (item, array){
                if( item.latitude > minLat && item.latitude < maxLat  &&
                    item.longitude < maxLong && item.longitude > minLong) {
                    results.push(item);
                }
            });
            return results;
        },

        bergriffSearchGeoTags : function (begriff) {
            return geoTags.filter((geoTag) => {
                return geoTag.name.includes(begriff);
            } )
        },

        pushGeoTag : function (item) {
            geoTags.push(item);
        },

        popGeoTag : function (item) {
            geoTags.splice(geoTags.indexOf(item),1);
        },

        getTagList : function() {
            return geoTags;
        }
    }
})();

/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function(req, res) {
    res.render('gta', {
        taglist: inMemory.getTagList(),
        latitude : undefined,
        longitude : undefined,
        hashtag : undefined,
        name : undefined
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */

app.post("/tagging", function (req, res) {
    let body = req.body;
    console.log(req.body);
    let newTag = new GeoTag(body.latitude,body.longitude,body.name,body.hashtag);
    console.log(newTag);
    inMemory.pushGeoTag(newTag);
    console.log(inMemory.getTagList());
    res.render("gta",{
        taglist: inMemory.getTagList(),
        latitude: body.latitude,
        longitude: body.longitude,
        name: body.name,
        hashtag: body.hashtag
    })
});

/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

app.post("/discovery", function (req, res) {
    let body = req.body;
    let taglist;

    if(body.searchterm !== undefined && body.searchterm !== "") {
        taglist = inMemory.bergriffSearchGeoTags(body.searchterm);
    } else {
        if(body.latitude !== undefined && body.longitude !== undefined) {
            taglist = inMemory.radiusSearchGeoTags(standardRadius,body.latitude, body.longitude);
        } else {
            taglist = inMemory.radiusSearchGeoTags(standardRadius,standardLat, standardLong);
        }
    }

    res.render("gta", {
        title: "discovery",
        taglist: taglist,
        latitude: body.latitude,
        longitude: body.longitude,
        name: body.name,
        hashtag: body.hashtag
    });
});

// Rest API

app.get('/geotags/:name', function(req,res) {
    if(req.params.name !== undefined) {
        const tag = inMemory.bergriffSearchGeoTags(req.params.id);
        if(tag === undefined) {
            res.status(402).end();
        } else {
            res.json(tag);
        }
    } else {
        res.status(400).end();
    }
});

app.put('/geotags/:name', function(req,res) {
    if(req.params.id !== undefined) {
        const tag = inMemory.bergriffSearchGeoTags(req.params.id);
        if(tag) {
            tag.longitude = req.body.longitude;
            tag.latitude = req.body.latitude;
            tag.name = req.body.name;
            tag.hashtag = req.body.hashtag;
        } else {
            let newTag = new GeoTag(req.body.longitude,req.body.latitude,req.body.name,req.body.hashtag);
            inMemory.pushGeoTag(newTag);
        }
        req.status(201).end();
    } else {
        res.status(400).end();
    }
})

app.delete('/geotags/:name', function(req, res) {
    if(req.params.id !== undefined) {
        const tag = inMemory.bergriffSearchGeoTags(req.params.id);
        if(tag) {
            inMemory.popGeoTag(tag);
            req.status(200).end();
        } else {
            req.status(400).end();
        }
    } else {
        res.status(400).end();
    }
});

app.get('/test', function(req,res) {
    res.status(205).end();
})

/**
 * Setze Port und speichere in Express.
 */

var port = 42069;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);
