var svgNS = "http://www.w3.org/2000/svg";

const foreground = "#bf4aa8";

const visibleDots = false;
const radius = "2.5";
const strokewidth = "0";
const mouseIndex = -1;

var isMobile = false;

var delta = 10;
var a_scale = 0.5**2;
var min_dist = 1;

var boxName = "Box";
var box = document.getElementById(boxName);

var boxContainerName = "BoxContainer";
var boxContainer = document.getElementById(boxContainerName);
var mouseContainerName = "MouseListener";
var mouseListener = document.getElementById(mouseContainerName);

var width = parseFloat(boxContainer.clientWidth);
var height = parseFloat(boxContainer.clientHeight);


var voronoi = d3.voronoi();
var AllPoints = {}
var AllColors = {}

function getAccX(pointName){
  // Get acceleration from box
  var point = AllPoints[pointName];
  var x = point.x;
  var a_x = (1/(x + min_dist)**2 - 1/(width - x + min_dist)**2)*a_scale;
  // Get acceleration from other points
  for (var k in AllPoints) {
    if (k == pointName) {continue;}
    var otherPoint = AllPoints[k];
    a_x -= a_scale * (otherPoint.x - point.x)/((otherPoint.x - point.x)**2 + (otherPoint.y - point.y)**2 + min_dist**2)**1.5;
  }
  return a_x;
}

function getAccY(pointName){
  var point = AllPoints[pointName];
  var y = point.y;
  var a_y = (1/(y + min_dist)**2 - 1/(height - y + min_dist)**2)*a_scale;
  // Get acceleration from other points
  for (var k in AllPoints) {
    if (k == pointName) {continue;}
    var otherPoint = AllPoints[k];
    a_y -= a_scale * (otherPoint.y - point.y)/((otherPoint.x - point.x)**2 + (otherPoint.y - point.y)**2 + min_dist**2)**1.5;
  }
  return a_y;
}

function updatePoint(pointName){
  var point = AllPoints[pointName];
  if (point.x <= 0){point.x = 1;}
  if (point.x >= width){point.x = width - 1;}
  if (point.y <= 0){point.y = 1;}
  if (point.y >= height){point.y = height-1;}
  point.a_x = getAccX(pointName);
  point.a_y = getAccY(pointName);
  point.v_x = point.v_x + delta*point.a_x;
  point.v_y = point.v_y + delta*point.a_y;
  var new_x = point.x + delta*point.v_x;
  var new_y = point.y + delta*point.v_y;
  if ((new_x <= 0) || (new_x >= width) || (new_y <= 0) || (new_y >= height)){
    new_x = point.x;
    new_y = point.y;
    point.v_x = 0;
    point.v_y = 0;
  }
  point.x = new_x;
  point.y = new_y;
  if (visibleDots) {
    var object = document.getElementById(pointName);
    object.setAttribute("cx", point.x);
    object.setAttribute("cy", point.y);
  }
}

function getVoronoi(){
  var xyArray = [];
  for (var k in AllPoints){
    xyArray.push([AllPoints[k].x,AllPoints[k].y]);
  }
  var polygons = voronoi.triangles(xyArray);
  return polygons;
}

function clearVoronoi(){
  var polygons = box.getElementsByTagName("polygon");
  if (polygons.length > 0){
    box.removeChild(polygons[0]);
    clearVoronoi();
  }
}

function triangleName(polygon){
  var nameArray = [];
  for (var i in polygon){
    var p = polygon[i];
    for (var k in AllPoints){
      if ((AllPoints[k].x == p[0]) && (AllPoints[k].y == p[1])){
        nameArray.push(k);
      }
    }
  }
  return nameArray;
}

function drawVoronoi(){
  var polygons = getVoronoi();
  clearVoronoi();
  for (var i in polygons){
    var polygon = polygons[i];
    var name = triangleName(polygon);
    if (!(name in AllColors)){
      AllColors[name] = [0.5*Math.random(), Math.random()];
    }
    var points = "";
    for (var j = 0; j < polygon.length; j++){
      var point = polygon[j];
      points += point[0] + "," + point[1] + " ";
    }
    var newPolygon = document.createElementNS(svgNS, "polygon");
    newPolygon.setAttribute("points", points);
    newPolygon.setAttribute("stroke", "white");
    newPolygon.setAttribute("stroke-width", "1");
    if (AllColors[name][1] <= 0.8){
      newPolygon.setAttribute("fill", "white");
    }
    if (AllColors[name][1] > 0.8){
      newPolygon.setAttribute("fill", foreground);
    }
    newPolygon.setAttribute("fill-opacity", AllColors[name][0]);
    box.appendChild(newPolygon);
  }
}

function updateAllPoints(){
  for (var k in AllPoints){
    if (k == mouseIndex) {continue;}
    updatePoint(k);
  }
}

function updateClient() {
  if ((width != parseFloat(boxContainer.clientWidth))||(height != parseFloat(boxContainer.clientHeight))){
    width = parseFloat(boxContainer.clientWidth);
    height = parseFloat(boxContainer.clientHeight);
  }
}

function Animate() {
  updateClient();
  updateAllPoints();
  drawVoronoi();
  requestAnimationFrame(Animate);
}

function Initialize(nPoints) {
  for(var i = 0; i < nPoints; i++){
    addPoint(Math.random()*(width - 10.0) + 5.0, Math.random()*(height - 10.0) + 5.0);
  }
}

function addPoint(xval,yval){
  clearVoronoi();
  drawVoronoi();
  var keys = Object.keys(AllPoints);
  var id = 0;
  if (keys.length){
    id = Math.max(...keys) + 1;
  }
  AllPoints[id] = {
    x: xval,
    y: yval,
    v_x:0,
    v_y:0,
    a_x:0,
    a_y:0,
  };
  AllColors[id] = [0.5*Math.random(), 0];
}

function addMousePoint(event){
  var x0 = boxContainer.offsetLeft;
  var y0 = boxContainer.offsetTop;
  var xval = event.clientX - x0;
  var yval = event.clientY - y0;
  clearVoronoi();
  drawVoronoi();
  AllPoints[mouseIndex] = {
    x: xval,
    y: yval,
    v_x:0,
    v_y:0,
    a_x:0,
    a_y:0,
  };
  AllColors[mouseIndex] = [1.0,1.0];
}

function updateMousePoint(event){
  if (!AllPoints[mouseIndex]) return;
  var x0 = boxContainer.offsetLeft;
  var y0 = boxContainer.offsetTop;
  var point = AllPoints[mouseIndex];
  point.x = event.clientX - x0;
  point.y = event.clientY - y0;
  if (visibleDots) {
    var object = document.getElementById(mouseIndex);
    object.setAttribute("cx", point.x);
    object.setAttribute("cy", point.y);
  }
}

function removeMousePoint(){
  delete AllPoints[mouseIndex];
  delete AllColors[mouseIndex];
  if (visibleDots) {
    var object = document.getElementById(mouseIndex);
    box.removeChild(object);
  }
}

function clickFunc(event){
    removeMousePoint();
    var x0 = boxContainer.offsetLeft;
    var y0 = boxContainer.offsetTop;
    addPoint(event.clientX - x0, event.clientY - y0);
}

mouseListener.addEventListener("touchstart", function(event){isMobile = true;});
mouseListener.addEventListener("mouseover", function(event){if (isMobile) return; addMousePoint(event);});
mouseListener.addEventListener("mousemove", function(event){if (isMobile) return; updateMousePoint(event);});
mouseListener.addEventListener("mouseout", function(){if (isMobile) return; removeMousePoint();});
mouseListener.addEventListener("click", function(event){clickFunc(event);});

Initialize(12);
Animate();
