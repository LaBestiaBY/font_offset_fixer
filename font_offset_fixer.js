var fileName = process.argv[2];
var path = fileName.slice(0, fileName.lastIndexOf('\\') + 1);

const fs = require('fs');
var xml = fs.readFileSync(fileName, {'encoding': 'utf8'});
// var xml = fs.readFileSync('outro_bonus_x1-export.xml', {'encoding': 'utf8'});

var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
parseString(xml, function (err, result) {

    if (!fs.existsSync(path + 'output')) {
        fs.mkdirSync(path + 'output');
    }

    var previousFontName = result.font.info[0]['$'].face.slice(result.font.info[0]['$'].face.lastIndexOf('\\') + 1);
    var fontName = previousFontName.slice(0, previousFontName.indexOf('-export'));
    var previousPngName = previousFontName + '.png';
    var pngName = fontName + '.png';

    if (fs.existsSync(path + previousPngName)) {
        fs.renameSync(path + previousPngName, path + 'output/' + pngName);
    }

    result.font.info[0]['$'].face = fontName;
    result.font.pages[0].page[0]['$'].file = pngName;

    var minOffset = result.font.chars[0].char[0]['$'].yoffset;

    for (var i = 0; i < result.font.chars[0].char.length; i++) {
        var char = result.font.chars[0].char[i]['$'];
        if (char.id !== '32' && char.id !== '9') {
            if (+char.yoffset < +minOffset) {
                minOffset = char.yoffset;
            }
        }
    }

    for (i = 0; i < result.font.chars[0].char.length; i++) {
        char = result.font.chars[0].char[i]['$'];
        if (char.id !== '32' && char.id !== '9') {
            char.yoffset = +char.yoffset - +minOffset;
        }
    }

    var builder = new xml2js.Builder({headless:true});
    var newXml = builder.buildObject(result);

    fs.writeFileSync(path + 'output/' + fontName + '.fnt', newXml, {'encoding': 'utf8'});

    fs.unlink(fileName);
});