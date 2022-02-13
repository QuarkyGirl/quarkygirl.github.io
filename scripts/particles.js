var svgNS = "http://www.w3.org/2000/svg";

const visibleDots = true;
const radius = "2.5";
const strokewidth = "0";
const track = false;

var delta = 16;
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
voronoi.extent([[0,0],[width,height]])

var AllPoints = {}

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
  point.a_x = getAccX(pointName);
  point.a_y = getAccY(pointName);
  point.v_x = point.v_x + delta*point.a_x;
  point.v_y = point.v_y + delta*point.a_y;
  var new_x = point.x + delta*point.v_x;
  if ((new_x <= 0) || (new_x >= width)){
    new_x = point.x;
    new_y = point.y;
    point.v_x = 0;
    point.v_y = 0;
  }
  var new_y = point.y + delta*point.v_y;
  if ((new_y <= 0) || (new_y >= height)){
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
  for (var key in Object.keys(AllPoints)){
    xyArray.push([AllPoints[key].x,AllPoints[key].y]);
  }
  var polygons = voronoi.polygons(xyArray);
  return polygons;
}

function clearVoronoi(){
  var polygons = box.getElementsByTagName("polygon");
  if (polygons.length > 0){
    box.removeChild(polygons[0]);
    clearVoronoi();
  }
}

function drawVoronoi(){
  polygons = getVoronoi();
  clearVoronoi();
  for (var i in polygons){
    var polygon = polygons[i];
    var points = "";
    for (var j = 0; j < polygon.length; j++){
      var point = polygon[j];
      points += point[0] + "," + point[1] + " ";
    }
    var newPolygon = document.createElementNS(svgNS, "polygon");
    newPolygon.setAttribute("points", points);
    newPolygon.setAttribute("stroke", "white");
    newPolygon.setAttribute("stroke-width", "1");
    newPolygon.setAttribute("fill", "none");
    newPolygon.setAttribute("fill-opacity", "0.2")
    box.appendChild(newPolygon);
  }
}

function updateAllPoints(){
  var keys = Object.keys(AllPoints);
  for (var k in keys){
    updatePoint(k);
  }
}

function updatePath(){
  var path = document.getElementById("path");
  var currentpath = path.getAttribute("d");
  path.setAttribute("d", currentpath +  " L " + AllPoints[0].x + " " + AllPoints[0].y);
}

function updateClient() {
  if ((width != parseFloat(boxContainer.clientWidth))||(height != parseFloat(boxContainer.clientHeight))){
    width = parseFloat(boxContainer.clientWidth);
    height = parseFloat(boxContainer.clientHeight);
    voronoi.extent([[0,0],[width,height]]);
  }
}

function Animate() {
  updateClient();
  updateAllPoints();
  drawVoronoi();
  if (track){
    updatePath();
  }
  requestAnimationFrame(Animate);
}

function addPoint(xval,yval){
  var keys = Object.keys(AllPoints);
  var newPoint = document.createElementNS(svgNS, "circle");
  newPoint.setAttribute("cx", xval);
  newPoint.setAttribute("cy", yval);
  newPoint.setAttribute("r", radius);
  newPoint.setAttribute("stroke", "#4c7782");
  newPoint.setAttribute("stroke-width", strokewidth);
  newPoint.setAttribute("fill", "white");
  newPoint.id = keys.length.toString();
  clearVoronoi();
  if (visibleDots) {
    box.appendChild(newPoint);
  }
  drawVoronoi();
  AllPoints[newPoint.id] = {
    x: xval,
    y: yval,
    v_x:0,
    v_y:0,
    a_x:0,
    a_y:0,
  };
}

function addPath(){
  var path = document.createElementNS(svgNS, "path");
  path.id = "path";
  path.setAttribute("d", "M " + AllPoints[0].x + " " + AllPoints[0].y);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "black");
  box.appendChild(path);
}

function Initialize(nPoints) {
  for(var i = 0; i < nPoints; i++){
    addPoint(Math.random()*(width - 10.0) + 5.0, Math.random()*(height - 10.0) + 5.0);
  }
  if (track){
    addPath();
  }
}

mouseListener.addEventListener("click", function(){
    var x0 = boxContainer.offsetLeft;
    var y0 = boxContainer.offsetTop;
    addPoint(event.clientX - x0, event.clientY - y0);
});

Initialize(12);
Animate();
