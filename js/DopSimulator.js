var BtnAddSat = document.getElementById("ButtonAddSat");
var BtnRemSat = document.getElementById("ButtonRemoveSat");


function writeMessage(message) {
    text.setText(message);
    layer.draw();
}

function loadImages(sources, callback) {
    var assetDir = '/asset/';
    var images = {};
    var loadedImages = 0;
    var numImages = 0;
    for (var src in sources) {
        numImages++;
    }
    for (var src in sources) {
        images[src] = new Image();
        images[src].onload = function () {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = assetDir + sources[src];
    }
}

var MakeBkg = function (width, height) {

    var layer = new Kinetic.Layer();

    var fullbound = new Kinetic.Circle({
        x: width / 2,
        y: height / 2,
        radius: 250,
        stroke: 'black',
        fill: 'white',
        strokeWidth: 2,
        dashArray: [33, 0]
    });
    layer.add(fullbound);

    for (var n = 0; n < 5; n++) {
        var dashspace = 10;
        var lwid = 1;
        if (n % 2 == 0)
            dashspace = 0;
        if (n == 5) {
            dashspace = 0;
            lwid = 3;
        }

        var bound1 = new Kinetic.Circle({
            x: width / 2,
            y: height / 2,
            radius: 50 * n,
            stroke: 'black',
            strokeWidth: lwid,
            dashArray: [33, dashspace]
        });
        layer.add(bound1);
    }

    var horzline = new Kinetic.Line({
        y: height / 2,
        points: [-width / 2, 0, width, 0],
        stroke: 'black',
        strokeWidth: 1,
    });

    var vertline = new Kinetic.Line({
        x: width / 2,
        points: [0, 0, 0, height],
        stroke: 'black',
        strokeWidth: 1,
    });
    layer.add(horzline);
    layer.add(vertline);

    var deg72 = new Kinetic.Text({
        x: width / 2 + 35,
        y: height / 2 + 35,
        text: '72°',
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: '#555',
        align: 'center'
    });
    layer.add(deg72);
    var deg54 = new Kinetic.Text({
        x: width / 2 + 70,
        y: height / 2 + 70,
        text: '54°',
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: '#555',
        align: 'center'
    });
    layer.add(deg54);
    var deg36 = new Kinetic.Text({
        x: width / 2 + 105,
        y: height / 2 + 105,
        text: '36°',
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: '#555',
        align: 'center'
    });
    layer.add(deg36);
    var deg18 = new Kinetic.Text({
        x: width / 2 + 140,
        y: height / 2 + 140,
        text: '18°',
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: '#555',
        align: 'center'
    });
    layer.add(deg18);
    return layer;
};

function GetRandomPosition(_radius) {
    // var angle = _random.NextDouble() * Math.PI * 2;
    //var radius = Math.Sqrt(_random.NextDouble()) * _radius;

    var t = 2 * Math.PI * Math.random();

    var r = _radius * Math.sqrt(Math.random());
    var x = r * Math.cos(t);
    var y = r * Math.sin(t);
    return { x: x, y: y };
}
function GetSatellites(images, width, height) {
    nsat++;
    var pos = GetRandomPosition(250);
    var satellite = new Kinetic.Image({
        image: images.satellite,
        x: (width / 2) + pos.x,
        y: (height / 2) + pos.y,
        width: 70,
        height: 70,
        offsetX: 35,
        offsetY: 35,
        text: 'satellite',
        id: "sat" + nsat,
        draggable: true,
        dragBoundFunc: function (pos) {
            var x = width / 2;
            var y = height / 2;
            var radius = 250;
            var scale = radius / Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
            if (scale < 1)
                return {
                    y: Math.round((pos.y - y) * scale + y),
                    x: Math.round((pos.x - x) * scale + x)
                };
            else
                return pos;
        }

    });
    satellite.setListening(true);
    // write out drag and drop events
    satellite.on('dragstart', function () {
        //clear dops
    });
    satellite.on('dragend', function () {
        CalculateDOPs();

    });
    return satellite;
}

function CalculateDOPs() {

    if (nsat < 4) {
        document.getElementById("output-nsat").innerHTML = "# Sat: " + nsat;
        document.getElementById("output-pdop").innerHTML = "PDOP: N/A";
        document.getElementById("output-hdop").innerHTML = "HDOP: N/A";
        document.getElementById("output-gdop").innerHTML = "GDOP: N/A";
        document.getElementById("output-vdop").innerHTML = "VDOP: N/A";
        document.getElementById("output-tdop").innerHTML = "TDOP: N/A";
        return;
    }

    var A = numeric.rep([nsat, 4], 0);
    var azlist = [];
    var elvlist = [];
    for (var n = 1; n <= nsat; n++) {
        var cursat = layer.find('#sat' + n)[0];
        var curposX = cursat.getAbsolutePosition().x - 250.0;
        var curposY = 250.0 - cursat.getAbsolutePosition().y;

        var az = 360.0 - Math.atan2(curposY, curposX) * 180.0 / Math.PI - 270.0;
        if (az < 0) {
            az = az + 360.0;
        }

        var elv = (90.0 - Math.sqrt(curposY * curposY + curposX * curposX) * 90.0 / 250.0);



        if (elv < 0)
            elv = 0;

        azlist.push(az);
        elvlist.push(elv);
        var B = [Math.cos(elv * Math.PI / 180.0) * Math.sin(az * Math.PI / 180.0), Math.cos(elv * Math.PI / 180.0) * Math.cos(az * Math.PI / 180.0), Math.sin(elv * Math.PI / 180.0), 1];
        numeric.setBlock(A, [n - 1, 0], [n - 1, 3], [B]);
    }
    var Q = numeric.dot(numeric.transpose(A), A);
    var Qinv = numeric.inv(Q);
    var pdop = Math.sqrt(Qinv[0][0] + Qinv[1][1] + Qinv[2][2]);
    var hdop = Math.sqrt(Qinv[0][0] + Qinv[1][1]);
    var gdop = Math.sqrt(Qinv[0][0] + Qinv[1][1] + Qinv[2][2] + Qinv[3][3]);
    var vdop = Math.sqrt(Qinv[2][2]);
    var tdop = Math.sqrt(Qinv[3][3]);
    document.getElementById("output-nsat").innerHTML = "# Sat: " + nsat;
    document.getElementById("output-pdop").innerHTML = "PDOP: " + parseFloat(Math.round(pdop * 100) / 100).toFixed(2);
    document.getElementById("output-hdop").innerHTML = "HDOP: " + parseFloat(Math.round(hdop * 100) / 100).toFixed(2);
    document.getElementById("output-gdop").innerHTML = "GDOP: " + parseFloat(Math.round(gdop * 100) / 100).toFixed(2);
    document.getElementById("output-vdop").innerHTML = "VDOP: " + parseFloat(Math.round(vdop * 100) / 100).toFixed(2);
    document.getElementById("output-tdop").innerHTML = "TDOP: " + parseFloat(Math.round(tdop * 100) / 100).toFixed(2);
    return;
}
function initStage(images) {
    var bkglayer = MakeBkg(stage.getWidth(), stage.getHeight());
    var satellite = GetSatellites(images, stage.getWidth(), stage.getHeight());

    stage.add(bkglayer);
    layer.add(satellite);
    layer.add(text);
    stage.add(layer);

    BtnAddSat.addEventListener('click', function () {
        if (nsat < 100) {
            var newsat = GetSatellites(images, stage.getWidth(), stage.getHeight());
            layer.add(newsat);
            stage.add(layer);
            CalculateDOPs();
        }
        else {
            $('ButtonAddSat').prop('disabled', true);
        }

    }, false);

    BtnRemSat.addEventListener('click', function () {
        var shape = layer.find('#sat' + nsat)[0];
        shape.remove();
        nsat--;
        layer.draw();
        CalculateDOPs();
    }, false);

};


var nsat = 0;

var stage = new Kinetic.Stage({
    container: 'container',
    width: 503,
    height: 503
});

var layer = new Kinetic.Layer();

var text = new Kinetic.Text({
    x: 10,
    y: 10,
    fontFamily: 'Calibri',
    fontSize: 24,
    text: '',
    fill: 'black'
});

var sources = {
    satellite: 'satellite.png'
};

loadImages(sources, initStage);
