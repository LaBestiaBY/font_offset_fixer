const fs = require('fs');
const xml2js = require('xml2js');

fs.writeFileSync('log.txt', '', {'encoding': 'utf8'});

var fileName = process.argv[2];
var path = fileName.slice(0, fileName.lastIndexOf('\\') + 1);
log('file name: ' + fileName + ' \n');
log('path: ' + path + ' \n\n');

var xml = fs.readFileSync(fileName, {'encoding': 'utf8'});
log('source xml:\n' + xml + ' \n\n');

var parseString = require('xml2js').parseString;
parseString(xml, function (err, result) {

    if (!fs.existsSync(path + 'output')) {
        fs.mkdirSync(path + 'output');
        log('directory "output" was created. \n\n');
    }

    var previousFontName = result.font.info[0]['$'].face.slice(result.font.info[0]['$'].face.lastIndexOf('\\') + 1);
    var fontName = previousFontName.slice(0, previousFontName.indexOf('-export'));
    var previousPngName = previousFontName + '.png';
    var pngName = fontName + '.png';
    log('previousFontName: ' + previousFontName + ' \n');
    log('fontName: ' + fontName + ' \n');
    log('previousPngName: ' + previousPngName + ' \n');
    log('pngName: ' + pngName + ' \n\n');

    if (fs.existsSync(path + previousPngName)) {
        copyFile(path + previousPngName, path + 'output/' + pngName)
    }

    result.font.info[0]['$'].face = fontName;
    result.font.pages[0].page[0]['$'].file = pngName;

    var minOffset = findMinOffset(result.font.chars[0].char);
    log('min offset: ' + minOffset + ' \n\n');

    for (i = 0; i < result.font.chars[0].char.length; i++) {
        char = result.font.chars[0].char[i]['$'];
        if (char.id !== '32' && char.id !== '9') {
            char.yoffset = +char.yoffset - +minOffset;
        }
    }

    var builder = new xml2js.Builder({headless:true});
    var newXml = builder.buildObject(result);

    newXml = fixComments(newXml);
    log('xml after build:\n' + newXml + ' \n\n');

    fs.writeFileSync(path + 'output/' + fontName + '.fnt', newXml, {'encoding': 'utf8'});
    // fs.unlink(fileName);
});

/**
 *
 * @param charsArray
 * @returns {number|*}
 */
function findMinOffset(charsArray) {
    var minOffset = charsArray[0]['$'].yoffset;
    for (var i = 0; i < charsArray.length; i++) {
        var char = charsArray[i]['$'];
        if (char.id !== '32' && char.id !== '9') {
            minOffset = +char.yoffset < +minOffset ? char.yoffset : minOffset;
        }
    }
    return minOffset;
}

/**
 *
 * @param data
 */
function log(data) {
    fs.appendFileSync('log.txt', data);
}

/**
 *
 * @param source
 * @param target
 */
function copyFile(source, target) {
    var rd = fs.createReadStream(source);
    rd.on('error', function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on('error', function(err) {
        done(err);
    });
    wr.on('close', function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (err) {
            log('ERROR: ' + err)
        }
    }
}

/**
 *
 * @param xml
 * @returns {*}
 */
function fixComments(xml) {
    var beforeChars = xml.slice(0, xml.indexOf('<char id'));
    var chars = xml.slice(xml.indexOf('<char id'), xml.indexOf('</chars'));
    var afterChars = xml.slice(xml.indexOf('</chars'));
    var splitChars = chars.split('\n');
    chars = '';

    for (var line = 0; line < splitChars.length; line++) {
        if (splitChars[line].indexOf('char') !== -1) {
            var beforeCharNum = splitChars[line].indexOf('"');
            var afterCharNum = splitChars[line].indexOf('"', beforeCharNum + 1);
            var charNum = splitChars[line].slice(beforeCharNum + 1, afterCharNum);
            splitChars[line] += '<!-- ' + String.fromCharCode(charNum) + ' -->\n';
            chars += splitChars[line];
        }
    }
    return beforeChars + chars + afterChars;
}
