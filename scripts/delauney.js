var svgNS = "http://www.w3.org/2000/svg";

const foreground = "var(--theme)";
const background = "var(--bg)";
const baseOpacity = 0.5;

const radius = "2.5";
const strokewidth = "0.2";
const mouseIndex = -1;

var isMobile = false;

var delta = 10;
var a_scale = 0.5**2;
var min_dist = 1;

var boxName = "box";
var box = document.getElementById(boxName);

var boxContainerName = "header";
var boxContainer = document.getElementById(boxContainerName);
var mouseContainerName = "mouse-listener";
var mouseListener = document.getElementById(mouseContainerName);

var width = parseFloat(boxContainer.clientWidth);
var height = parseFloat(boxContainer.clientHeight);


var voronoi = d3.voronoi();
var AllPoints = {};
var AllColors = {};
var reversePointLookup = {};



function updateAccs(){
  // set base accelerations
  for (let k in AllPoints){
    let point = AllPoints[k];
    point.a_x = (1/(point.x + min_dist)**2 - 1/(width - point.x + min_dist)**2)*a_scale;
    point.a_y = (1/(point.y + min_dist)**2 - 1/(height - point.y + min_dist)**2)*a_scale;

  }
  // now do pointwise accelerations
  let pointNames = Object.keys(AllPoints);
  for (let i = 0; i < pointNames.length-1; i++){
    for (let j = i+1; j<pointNames.length; j++){
      let pi = AllPoints[pointNames[i]];
      let pj = AllPoints[pointNames[j]];
      let mag = a_scale/((pj.x - pi.x)**2 + (pj.y - pi.y)**2 + min_dist**2)**1.5;
      pi.a_x += (pi.x - pj.x)*mag;
      pi.a_y += (pi.y - pj.y)*mag;
      pj.a_x += (pj.x - pi.x)*mag;
      pj.a_y += (pj.y - pi.y)*mag;
    }
  }
}

function updatePoint(point){
  point.v_x = point.v_x + delta*point.a_x;
  point.v_y = point.v_y + delta*point.a_y;
  let new_x = point.x + delta*point.v_x;
  let new_y = point.y + delta*point.v_y;
  if ((new_x <= 0) || (new_x >= width) || (new_y <= 0) || (new_y >= height)){
    new_x = Math.max(new_x,min_dist,point.x);
    new_x = Math.min(new_x,width-min_dist,point.x);
    new_y = Math.max(new_y,min_dist,point.y);
    new_y = Math.min(new_y,height-min_dist,point.y);
    point.v_x = 0;
    point.v_y = 0;
  }
  point.x = new_x;
  point.y = new_y;
}

function updateVoronoi(){
  var xyArray = [];
  var reversePointLookup = {};
  for (let k in AllPoints){
    point = AllPoints[k];
    if (k != mouseIndex) {
      updatePoint(point)
    }
    reversePointLookup[[point.x,point.y].toString()] = k;
    xyArray.push([point.x,point.y]);
  }
  var polygons = voronoi.triangles(xyArray);
  var triangles = {};
  for (let i in polygons){
    let name = '';
    let polygon = polygons[i];
    for (let j in polygon){
      let xy = polygon[j];
      name += reversePointLookup[xy.toString()];
    }
    triangles[name] = polygon;
  }
  return triangles;
}

function clearVoronoi(){
  var polygons = box.getElementsByTagName("polygon");
  if (polygons.length > 0){
    box.removeChild(polygons[0]);
    clearVoronoi();
  }
}

function drawVoronoi(triangles){
  clearVoronoi();
  for (var name in triangles){
    var polygon = triangles[name];
    if (!(name in AllColors)){
      AllColors[name] = [baseOpacity*Math.random(), Math.random()];
    }
    var points = "";
    for (var j = 0; j < polygon.length; j++){
      var point = polygon[j];
      points += point[0] + "," + point[1] + " ";
    }
    var newPolygon = document.createElementNS(svgNS, "polygon");
    newPolygon.setAttribute("points", points);
    newPolygon.setAttribute("stroke", "black");
    newPolygon.setAttribute("stroke-width", strokewidth);
    if (AllColors[name][1] <= 0.8){
      newPolygon.setAttribute("fill", background);
    }
    if (AllColors[name][1] > 0.8){
      newPolygon.setAttribute("fill", foreground);
    }
    newPolygon.setAttribute("fill-opacity", AllColors[name][0]);
    box.appendChild(newPolygon);
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
  updateAccs();
  triangles = updateVoronoi();
  drawVoronoi(triangles);
  requestAnimationFrame(Animate);
}

function Initialize(nPoints) {
  for(var i = 0; i < nPoints; i++){
    addPoint(Math.random()*(width - 10.0) + 5.0, Math.random()*(height - 10.0) + 5.0);
  }
}

function addPoint(xval,yval){
  clearVoronoi();
  polygons = updateVoronoi();
  drawVoronoi(polygons);
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
}

function removeMousePoint(){
  delete AllPoints[mouseIndex];
  delete AllColors[mouseIndex];
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
