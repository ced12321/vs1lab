let geoTags = [];

function radiusSearchGeoTags(radius, lat, long) {
    const minLat = lat - radius;
    const maxLat = lat + radius;
    const minLong = long - radius;
    const maxLong = long + radius;
    let results = [];
    geoTags.forEach(function (item, array){
        if( item.latitude > minLat && item.latitude < maxLat  &&
            item.longitude < maxLong && item.longitude > minLong) {
            results.push(item);
        }
    });
    return results;
}

function bergriffSearchGeoTags(begriff) {
    return geoTags.includes(begriff);
}

function pushGeoTag(item) {
    geoTags.push(item);
}

function popGeoTag(item) {
    geoTags.splice(geoTags.indexOf(item),1);
}

exports.radiusSearchGeoTags = radiusSearchGeoTags;
exports.bergriffSearchGeoTags = bergriffSearchGeoTags;
exports.pushGeoTag = pushGeoTag;
exports.popGeoTag = popGeoTag;