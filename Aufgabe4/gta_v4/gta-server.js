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
app.use(bodyParser.json());

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

        existsTag : function (name) {
            return geoTags.find((geoTag) => {
                return (geoTag.name === name);
            });
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


// Rest API

app.get('/geotags/:name', function(req,res) {
    if(req.params.name !== undefined) {
        const tag = inMemory.existsTag(req.params.name);
        res.json(tag);
        res.status(200).end();
    } else {
        res.status(400).end();
    }
});

app.get('/geotags', function(req,res) {
    if(req.query.name) {
        const tag = inMemory.bergriffSearchGeoTags(req.query.name);
        res.json(tag);
        res.status(200).end();
    } else {
        const tag = inMemory.getTagList();
        res.json(tag);
        res.status(200).end();
    }
});

app.post('/geotags', function(req,res) {
    if(req.body.name !== undefined) {
        const tag = inMemory.existsTag(req.body.name);
        if(tag) {
            res.status(400).end();
        } else {
            let newTag = new GeoTag(req.body.longitude,req.body.latitude,req.body.name,req.body.hashtag);
            inMemory.pushGeoTag(newTag);
        }
        res.status(201).end();
    } else {
        res.status(400).end();
    }
});

app.put('/geotags/:name', function(req,res) {
    if(req.params.name !== undefined) {
        const tag = inMemory.existsTag(req.params.name);
        if(tag) {
            if(req.body.longitude) tag.longitude = req.body.longitude;
            if(req.body.latitude) tag.latitude = req.body.latitude;
            if(req.body.name) tag.name = req.body.name;
            if(req.body.hashtag) tag.hashtag = req.body.hashtag;
            res.status(200).end();
        } else {
            res.status(401).end();
        }
    } else {
        res.status(400).end();
    }
});

app.delete('/geotags/:name', function(req, res) {
    if(req.params.name !== undefined) {
        const tag = inMemory.existsTag(req.params.name);
        if(tag) {
            inMemory.popGeoTag(tag);
            res.status(200).end();
        } else {
            res.status(400).end();
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
