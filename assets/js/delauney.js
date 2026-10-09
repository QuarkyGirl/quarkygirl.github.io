var svgNS = "http://www.w3.org/2000/svg";

const foreground = "var(--animation-theme-color)";
const background = "var(--animation-bg-color)";
const baseOpacity = 0.5;
const strokewidth = "0.2";

const boxName = "box";
const boxContainerName = "header";
const mouseContainerName = "mouse-listener";

const maxCacheSize = 100;

const delta = 10;
const a_scale = 0.3**2;
const min_dist = 1;


var box = document.getElementById(boxName);
var boxContainer = document.getElementById(boxContainerName);
var mouseListener = document.getElementById(mouseContainerName);

var isMobile = false;
var width = parseFloat(boxContainer.clientWidth);
var height = parseFloat(boxContainer.clientHeight);

var mouseIndex = -1;
var allPoints = [];
var allTriangles = [];
var cachedColors = {};

// set point-to-point acceleration
function setPointAcc(id1, id2, seen) {
  let pi = allPoints[id1];
  let pj = allPoints[id2];
  let mag = a_scale/((pj.x - pi.x)**2 + (pj.y - pi.y)**2 + min_dist**2)**1.5;
  pi.a_x += (pi.x - pj.x)*mag;
  pi.a_y += (pi.y - pj.y)*mag;
}

// set total acceleration for all points
function updateAccs(){
  // set base accelerations
  for (let k in allPoints){
    let point = allPoints[k];
    point.a_x = (1/(point.x + min_dist)**2 - 1/(width - point.x + min_dist)**2)*a_scale;
    point.a_y = (1/(point.y + min_dist)**2 - 1/(height - point.y + min_dist)**2)*a_scale;
  }
  // now do point-to-point accelerations
  for (let i = 0; i < allTriangles.length; i+= 3) {
    setPointAcc(allTriangles[i],allTriangles[i+1]);
    setPointAcc(allTriangles[i+1],allTriangles[i+2]);
    setPointAcc(allTriangles[i+2],allTriangles[i]);
  }
}

// do forward differences to update each point's position and velocity
function updatePoint(point){
  point.v_x = point.v_x + delta*point.a_x;
  point.v_y = point.v_y + delta*point.a_y;
  let new_x = point.x + delta*point.v_x;
  let new_y = point.y + delta*point.v_y;
  if ((new_x <= min_dist) || (new_x >= width-min_dist)){
    new_x = Math.max(new_x,min_dist,point.x);
    new_x = Math.min(new_x,width-min_dist,point.x);
    new_y = Math.max(new_y,min_dist,point.y);
    new_y = Math.min(new_y,height-min_dist,point.y);
    new_x = Math.min(new_x,width-min_dist,point.x);
    point.v_x = -point.v_x/2.0;
    point.v_y = 0;
  }
  else if ((new_y <= min_dist) || (new_y >= height-min_dist)){
    new_x = Math.max(new_x,min_dist,point.x);
    new_x = Math.min(new_x,width-min_dist,point.x);
    new_y = Math.max(new_y,min_dist,point.y);
    new_y = Math.min(new_y,height-min_dist,point.y);
    point.v_x = 0;
    point.v_y = -point.v_y/2.0;
  }
  point.x = new_x;
  point.y = new_y;
}

// Hash triangle indices to index in olor cache. Cache size is limited so that
// it doesn't get too large; we don't care if we are reusing colors.
function hashTri(i1, i2, i3) {
  let hash = 17;
  hash = (hash * 31 + i1) | 0;
  hash = (hash * 31 + i2) | 0;
  hash = (hash * 31 + i3) | 0;
  return hash % maxCacheSize;
}

// Recompute Delaunay triangularization and update allTriangles
function updateTriangles(){
  if (allPoints.length < 3) return [];
  let xyArray = [];
  for (let k in allPoints){
    point = allPoints[k];
    if (k != mouseIndex) {
      updatePoint(point)
    }
    xyArray.push([point.x,point.y]);
  }
  let delaunay = d3.Delaunay.from(xyArray);
  allTriangles = delaunay.triangles;
}

// Update the SVG with the new Delaunay triangularization
function drawDelaunay(){
  var newPolygons = [];
  for (let i = 0; i < allTriangles.length; i+= 3){
    let name = hashTri(allTriangles[i],allTriangles[i+1],allTriangles[i+2]);
    if (!(name in cachedColors)){
      cachedColors[name] = [baseOpacity*Math.random(), Math.random()];
    }
    var points = "";
    for (let j = 0; j < 3; j++){
      let point = allPoints[allTriangles[i+j]];
      points += point.x + "," + point.y + " ";
    }
    let newPolygon = document.createElementNS(svgNS, "polygon");
    newPolygon.setAttribute("points", points);
    newPolygon.setAttribute("stroke", "black");
    newPolygon.setAttribute("stroke-width", strokewidth);
    if (cachedColors[name][1] <= 0.8){
      newPolygon.setAttribute("fill", background);
    }
    if (cachedColors[name][1] > 0.8){
      newPolygon.setAttribute("fill", foreground);
    }
    newPolygon.setAttribute("fill-opacity", cachedColors[name][0]);
    newPolygons.push(newPolygon);
  }
  box.replaceChildren(...newPolygons); 
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
  updateTriangles();
  drawDelaunay();
  requestAnimationFrame(Animate);
}

function Initialize(nPoints) {
  for(var i = 0; i < nPoints; i++){
    addPoint(Math.random()*(width - 10.0) + 5.0, Math.random()*(height - 10.0) + 5.0);
  }
}

function addPoint(xval,yval){
  allPoints.push({
    x: xval,
    y: yval,
    v_x:0,
    v_y:0,
    a_x:0,
    a_y:0,
  });
}

function addMousePoint(event){
  var x0 = boxContainer.offsetLeft;
  var y0 = boxContainer.offsetTop;
  var xval = event.clientX - x0;
  var yval = event.clientY - y0;
  mouseIndex = allPoints.length;
  allPoints.push({
    x: xval,
    y: yval,
    v_x:0,
    v_y:0,
    a_x:0,
    a_y:0,
  });
}

function updateMousePoint(event){
  if (mouseIndex == -1) return;
  var x0 = boxContainer.offsetLeft;
  var y0 = boxContainer.offsetTop;
  var point = allPoints[mouseIndex];
  point.x = event.pageX - x0;
  point.y = event.pageY - y0;
}

function removeMousePoint(){
  if (mouseIndex == -1) return;
  allPoints.splice(mouseIndex,1)
  mouseIndex = -1;
  updateTriangles();
}

function clickFunc(event){
  if (mouseIndex != -1) {
    mouseIndex = -1;
  }
  else {
    var x0 = boxContainer.offsetLeft;
    var y0 = boxContainer.offsetTop;
    addPoint(event.pageX - x0, event.pageY - y0);
  }
}

mouseListener.addEventListener("touchstart", function(event){isMobile = true;});
mouseListener.addEventListener("mouseover", function(event){if (isMobile) return; addMousePoint(event);});
mouseListener.addEventListener("mousemove", function(event){if (isMobile) return; updateMousePoint(event);});
mouseListener.addEventListener("mouseout", function(){if (isMobile) return; removeMousePoint();});
mouseListener.addEventListener("click", function(event){clickFunc(event);});

Initialize(12);
Animate();
