let visibilityMasks = {
  none: null,
  low: null,
  medium: null,
  light: null
};

let showLeftPanel = true;
let leftPanelWidth = 370;
let togglePanelButton;
let leftPanelContent = {
  temperature: { value: 0, unit: "°F" },
  uv: { value: 0 },
  visibility: { value: 0, unit: "km" },
  cloudCover: { value: 0, unit: "%" },
  wind: { speed: 0, direction: 0 },
  precipitation: { value: 0, unit: "mm" }
};

let weatherData = null;
let forecastData = null;
let currentDay = 0;
let transitionProgress = 0;
let isTransitioning = false;
let targetDay = 0;
let isLoading = true;
let cityInput;
let submitButton;
let uvOrbImg;
let cloudImg;
let bgMusic;
let isMusicPlaying = false;
let rainSound, snowSound;
let isRainPlaying = false;
let isSnowPlaying = false;
let showWeatherInfo = false;
let showInstructions = true;
let infoButton;
let closeInfoButton;
let closeInstructionsButton;
let musicButton;
let showLabels = false;
let labelsButton;
let closeLabelsButton;
let isPaused = false;
let aboutButton; // add this at the top with other global declarations
let isMouseOverInstructions = false;
let tempUnitButton;
let errorMessage = ""; 

let leftPanelTargetWidth = 370;
let leftPanelTransitioning = false;
let leftPanelTransitionProgress = 0;
let leftPanelTransitionSpeed = 0.06;

let tempSliderTarget = 0;
let tempSliderCurrent = 0;
let visibilitySliderTarget = 0;
let visibilitySliderCurrent = 0;
let sliderTransitionSpeed = 0.1;
let uvSliderCurrent = 0;
let uvSliderTarget = 0;
let previousUVValue = 1;

let windArrowRotation = 0;
let targetWindArrowRotation = 0;
let windArrowSize = 1.0;
let targetWindArrowSize = 1.0;
let windArrowTransitionSpeed = 0.08;
let citySuggestions = ["New York", "Los Angeles", "London", "Paris", "Beijing", "Tokyo", "Cairo", "Sydney", "Rio de Janeiro"];
let suggestionBox;

let windArrows = {
  no: null,
  mild: null,
  moderate: null,
  strong: null
};

let colors = {
  background: [207, 193, 214],
  tempCold: [50, 220, 255],
  tempCool: [85, 255, 195],
  tempWarm: [255, 235, 155],
  tempHot: [255, 145, 185],
  windParticles: [
    [90, 230, 255],
    [135, 255, 215],
    [255, 245, 185],
    [255, 175, 205],
    [135, 95, 214]
  ],
  buttonBg: [255, 255, 255, 150],
  buttonActive: [135, 95, 214, 200],
  panelBg: [255, 255, 255, 220],
  panelText: [50, 50, 50],
  inputBg: [255, 255, 255, 200],
  inputText: [50, 50, 50],
  inputBorder: [135, 95, 214, 150],
  /* ADDED LABEL COLORS */
  labelBg: [255, 255, 255, 200],
  labelText: [0, 0, 0]
};

function getBackgroundColorForLatitude(lat) {
  lat = abs(lat);

  if (lat <= 30) {
    return color('#d9c4dc'); // Tropical zone
  } else if (lat <= 60) {
    return color('#c1c1d6'); // Temperate zone
  } else {
    return color('#a9c3e1'); // Polar zone
  }
}

let clouds = [];
let windParticles = [];
let tempBlob = {
  baseRadius: 180,
  radiusVariation: 300,
  roundness: 0.3,
  color: [255, 175, 205],
  speed: 3.9,
  x: 0,
  y: 0,
  direction: "right",
  noiseOffset: 0,
  trail: [],
  maxTrailLength: 50
};

const apiKey = '028379fc9f6454b8718870ebf15309c1';
let city = 'Beijing';
let units = 'metric';

function preload() {
  uvOrbImg = loadImage('/weather-visualization/weather_assets.png');
  cloudImg = loadImage('/weather-visualization/cloud_assets.png');
  bgMusic = loadSound('/weather-visualization/background_sound.mp3');
  windCompass = loadImage('/weather-visualization/wind_compass.png');
  windArrows.no = loadImage('/weather-visualization/no_wind.png');
  windArrows.mild = loadImage('/weather-visualization/mild_wind.png');
  windArrows.moderate = loadImage('/weather-visualization/moderate_wind.png');
  windArrows.strong = loadImage('/weather-visualization/strong_wind.png');

  visibilityMasks.none = loadImage('/weather-visualization/visibility_none.png');
  visibilityMasks.low = loadImage('/weather-visualization/visibility_low.png');
  visibilityMasks.medium = loadImage('/weather-visualization/visibility_medium.png');
  visibilityMasks.light = loadImage('/weather-visualization/visibility_light.png');
  
  marlidesDisplayPro = loadFont('/weather-visualization/MarlideDisplayLight.woff');
  nimbusSansLight = loadFont('/weather-visualization/NimbusSansLight.woff');
   rainSound = loadSound('/weather-visualization/rain.mp3');
  snowSound = loadSound('/weather-visualization/snow.mp3');
}

let topRightUI;

function setup() {
  createCanvas(windowWidth, windowHeight);
  topRightUI = createDiv();
  topRightUI.id('top-right-ui');
  topRightUI.style('position', 'absolute');
  topRightUI.style('top', '25px');
  topRightUI.style('right', '20px');
  topRightUI.style('display', 'flex');
  topRightUI.style('gap', '1px');
  topRightUI.style('z-index', '100');
  /*
  if (bgMusic && !isMusicPlaying) {
  bgMusic.loop();
  isMusicPlaying = true;
} 
*/

  // Button functions
  createLabelsButton();
  createTempUnitButton();
  createMusicButton();
  createAboutButton();
  colorMode(RGB, 255, 255, 255, 255);
  smooth();
  
  textFont(nimbusSansLight);
  
  tempBlob.x = -tempBlob.baseRadius - 50;
  tempBlob.y = height / 2;
  tempBlob.baseRadius = width * 0.18;
  tempBlob.radiusVariation = width * 0.25;
  
  createInputElements();
  createInfoPanelButtons();
  createTogglePanelButton();
  
  initVisualElements();
  fetchWeatherData();
}

function toggleTempUnit() {
  units = units === 'metric' ? 'imperial' : 'metric';
  tempUnitButton.html(units === 'metric' ? '°C' : '°F');
  fetchWeatherData(); // Refresh weather with new unit
}

function createTogglePanelButton() {
  togglePanelButton = createButton('<');
  togglePanelButton.position(leftPanelWidth, height / 2);
  togglePanelButton.size(30, 60);
  togglePanelButton.mousePressed(toggleLeftPanel);
  togglePanelButton.style('font-size', '16px');
  togglePanelButton.style('background', 'rgba(255, 255, 255, 0.5)');
  togglePanelButton.style('border', 'none');
  togglePanelButton.style('border-radius', '0 15px 15px 0');
  togglePanelButton.style('font-family', 'nimbus-sans, sans-serif');
  togglePanelButton.style('transition', 'box-shadow 0.2s, background 0.2s');

  // ✨ Add glow on hover
 togglePanelButton.mouseOver(() => {
  togglePanelButton.style('box-shadow',
    '0 -4px 6px -2px rgba(135, 90, 255, 0.2), ' +  // top
    '3px 0 6px -2px rgba(135, 90, 255, 0.2), ' +   // right
    '0px 3 6px -2px rgba(135, 90, 255, 0.2), ' +   // left
    '0 4px 6px -2px rgba(135, 90, 255, 0.2)'       // bottom
  );
  togglePanelButton.style('background', 'rgba(255, 255, 255, 0.8)');
});
  togglePanelButton.mouseOut(() => {
    togglePanelButton.style('box-shadow', 'none');
    togglePanelButton.style('background', 'rgba(255, 255, 255, 0.5)');
  });
}


function toggleLeftPanel() {
  showLeftPanel = !showLeftPanel;
  togglePanelButton.html(showLeftPanel ? '<' : '>');
  leftPanelTargetWidth = showLeftPanel ? 370 : 0;
  leftPanelTransitioning = true;
  leftPanelTransitionProgress = 0;
}

function drawLeftPanel() {
  if (!showLeftPanel) return;
  
  // Panel background
  fill(255, 255, 255, 150);
  noStroke();
  rect(0, 0, leftPanelWidth, height);
  
  // Title
  textFont(marlidesDisplayPro);
  textSize(36);
  textAlign(LEFT, TOP);
  fill(0);
  text("Weather Visualization", 22, 50);
  
  // Description
  textSize(24);
  text(
  "Instructions:\n", 22, 115)
  textFont(nimbusSansLight);
  textSize(14);
  text(
  "1. Enter a city name in the input field\n" +
  "2. Click \"Get Weather\" to load data\n" +
  "3. Click the day buttons at the bottom to navigate\n" +
  "4. Click \"Labels\" for labeled weather info\n" +
  "5. Click the mute button to toggle background music\n\n",
  22, 150
);

  
  text("Below you can find a legend of the variables being\ntracked in this visual:", 22, 250);
  
  // Temperature section
  textFont(marlidesDisplayPro);
  textSize(24);
  text("Temperature", 22, 300);
  
  // Temperature gradient bar
  let gradientWidth = leftPanelWidth - 50;
  let gradientHeight = 10;
  let startX = 22;
  let startY = 344;
  
  // Create gradient inside the bar
  noStroke();
  for (let i = 0; i < gradientWidth; i++) {
    let inter = map(i, 0, gradientWidth, 0, 1);
    let c;
    if (inter < 0.33) {
      c = lerpColor(color(50, 220, 255), color(85, 255, 195), inter * 3);
    } else if (inter < 0.66) {
      c = lerpColor(color(85, 255, 195), color(255, 235, 155), (inter - 0.33) * 3);
    } else {
      c = lerpColor(color(255, 235, 155), color(255, 145, 185), (inter - 0.66) * 3);
    }
    fill(c);
    rect(startX + i, startY, 1, gradientHeight);
  }
  
let tempCelsius = units === 'metric' ? leftPanelContent.temperature.value
  : (leftPanelContent.temperature.value - 32) * 5 / 9;

let tempPercent = map(tempCelsius, -10, 40, 0, 1);
let markerX = startX + tempPercent * gradientWidth;
let markerY = startY + gradientHeight/2; 


push();
translate(markerX, markerY);
beginShape();
let blobSize = 20;
let noiseMax = 2;

stroke(tempBlob.color[0], tempBlob.color[1], tempBlob.color[2]);
strokeWeight(2);
fill(tempBlob.color[0], tempBlob.color[1], tempBlob.color[2], 50);

for (let angle = 0; angle < TWO_PI; angle += 0.1) {
  let xoff = map(cos(angle), -1, 1, 0, noiseMax);
  let yoff = map(sin(angle), -1, 1, 0, noiseMax);
  let r = blobSize + map(noise(xoff, yoff), 0, 1, -5, 5);
  let x = r * cos(angle);
  let y = r * sin(angle);
  vertex(x, y);
}
endShape(CLOSE);
pop();

  
  textFont(nimbusSansLight);
  noStroke();
  textSize(12);
  textAlign(CENTER, CENTER);
  fill(0);
  text(nf(leftPanelContent.temperature.value, 0, 0) + leftPanelContent.temperature.unit, markerX, startY + gradientHeight/2 + 1);
  
  // UV and Wind sections
  let halfWidth = (leftPanelWidth - 44) / 2;
  
  textFont(marlidesDisplayPro);
  textSize(24);
  textAlign(LEFT, TOP);
  text("UV", 22, 375);
  text("Wind", startX + halfWidth - 30, 375);
  
  // UV visualization 
  let uvX = 87;
  let uvY = 450;
  let windX = 250;
  let windY = 450;

  push();
  imageMode(CENTER);
  tint(255, 255); // full opacity
  image(uvOrbImg, uvX, uvY, 120, 120);
  pop();

  textFont(nimbusSansLight);
  textSize(18);
  fill(0);
  textAlign(CENTER, CENTER);
  text(leftPanelContent.uv.value, uvX, uvY - 4);

  push();
  imageMode(CENTER);
  tint(255, 255);
  image(windCompass, windX, windY, 120, 120);
  drawWindArrowAt(windX, windY, leftPanelContent.wind.speed, leftPanelContent.wind.direction);
  pop();
  
  // Visibility section
  textFont(marlidesDisplayPro);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Visibility", 22, 536);
  
  // Visibility gradient
  noStroke();
  for (let i = 0; i < gradientWidth; i++) {
    let inter = map(i, 0, gradientWidth, 0, 1);
    let alpha = map(inter, 0, 1,255, 0);
    fill(255, 255, 255, alpha);
    rect(startX + i, 585, 1, gradientHeight);
  }
  
  // Visibility marker
  let visKm = visibilitySliderCurrent; // ← already in km

let visPercent = constrain(map(visKm, 0, 10, 0, 1), 0, 1);

  let visMarkerX = startX + visPercent * gradientWidth;
  stroke(0);
  strokeWeight(1);
  fill(255, 255, 255, 0);
  ellipse(visMarkerX, 585 + gradientHeight/2, 40, 40);
  
  noStroke();
  textFont(nimbusSansLight);
  textSize(12);
  textAlign(CENTER, CENTER);
  fill(0);
  // text(Math.round(leftPanelContent.visibility.value) + " " + leftPanelContent.visibility.unit, visMarkerX, 585 + gradientHeight/2);
  
  let visValue = leftPanelContent.visibility.value;
let visText = units === 'metric'
  ? Math.round(visValue) + " km"
  : (visValue * 0.621371).toFixed(1) + " mi";
text(visText, visMarkerX, 585 + gradientHeight / 2);

  // Cloud Cover section
  textFont(marlidesDisplayPro);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Cloud Cover", 22, 625);
  
  // Cloud visualization
  let cloudX = leftPanelWidth / 2;
  let cloudY = 690;
  let cloudWidth = 400;
  let cloudHeight = 100;
  
  imageMode(CENTER);
  let cloudAlpha = map(leftPanelContent.cloudCover.value, 0, 100, 50, 255);
tint(255, cloudAlpha);
  image(cloudImg, cloudX, cloudY, cloudWidth, cloudHeight);
  
  textFont(nimbusSansLight);
  textSize(14);
  textAlign(CENTER, CENTER);
  fill(0, 0, 0, 200);
  text(leftPanelContent.cloudCover.value + "%", cloudX, cloudY);
  
  textFont(marlidesDisplayPro);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Precipitation", 22, 720);
  
  textFont(nimbusSansLight);
  textSize(18);
  textAlign(LEFT, TOP);
  
  // Display precipitation value with correct units
  let precipText = nf(leftPanelContent.precipitation.value, 0, 1) + " " + leftPanelContent.precipitation.unit;
  text(precipText, 275, 729);
  
}

function drawWindArrowAt(x, y, speed, direction) {
  let arrowImg;

// Always convert to m/s for visual scale consistency
let speedInMetersPerSecond = units === 'imperial' ? speed / 2.23694 : speed;

if (speedInMetersPerSecond <= 3.0) {
  arrowImg = windArrows.no;
  targetWindArrowSize = 0.8;
} else if (speedInMetersPerSecond <= 7.7) {
  arrowImg = windArrows.mild;
  targetWindArrowSize = 0.9;
} else if (speedInMetersPerSecond <= 13.5) {
  arrowImg = windArrows.moderate;
  targetWindArrowSize = 1.0;
} else {
  arrowImg = windArrows.strong;
  targetWindArrowSize = 1.1;
}

  if (!arrowImg) return;

  // Smooth rotation transition
 targetWindArrowRotation = radians((direction + 90) % 360);
  
  // Interpolate the current rotation towards the target
  let angleDiff = targetWindArrowRotation - windArrowRotation;
  
  // Handle the case where the angle wraps around
  if (angleDiff > PI) angleDiff -= TWO_PI;
  if (angleDiff < -PI) angleDiff += TWO_PI;
  
  windArrowRotation += angleDiff * windArrowTransitionSpeed;
  windArrowSize = lerp(windArrowSize, targetWindArrowSize, windArrowTransitionSpeed);

  push();
  imageMode(CENTER);
  translate(x, y);
  rotate(windArrowRotation);
  scale(windArrowSize);
  image(arrowImg, 0, 0);
  pop();
  
  // Add wind speed with units in the middle
  textFont(nimbusSansLight);
  textSize(18);
  fill(0);
  textAlign(CENTER, CENTER);
  let speedDisplay = units === 'metric'
  ? nf(speed, 0, 1) + " m/s"
  : nf(speed * 2.23694, 0, 1) + " mph";
text(speedDisplay, x + 1, y - 3);
}

function createLabelsButton() {
  labelsButton = createButton('LABELS');
  labelsButton.mousePressed(toggleLabels);
  labelsButton.parent(topRightUI);
  labelsButton.style('font-size', '14px');
  labelsButton.style('background', `rgba(${colors.buttonBg.join(',')})`);
  labelsButton.style('border', 'none');
  labelsButton.style('color', '#000');
  labelsButton.style('font-family', 'nimbus-sans, sans-serif');
  labelsButton.style('font-weight', '300');
  labelsButton.style('padding', '8px 12px');
  labelsButton.style('border-radius', '15px');
  labelsButton.style('margin', '0 5px');
  
  // Add hover effect like day buttons
  labelsButton.mouseOver(() => {
    labelsButton.style('background-color', `rgba(${colors.buttonActive[0]}, ${colors.buttonActive[1]}, ${colors.buttonActive[2]}, 0.7)`);
    labelsButton.style('color', '#fff');
  });
  
  labelsButton.mouseOut(() => {
    labelsButton.style('background-color', `rgba(${colors.buttonBg.join(',')})`);
    labelsButton.style('color', '#000');
  });
}

function mousePressed() {
  if (showLabels) {
    const bounds = labelsButton.elt.getBoundingClientRect();
    if (
      !(mouseX >= bounds.left && mouseX <= bounds.right &&
        mouseY >= bounds.top && mouseY <= bounds.bottom)
    ) {
      showLabels = false;
      isPaused = false;
      if (isMusicPlaying) bgMusic.play();
    }
  }

  if (showInstructions) {
    const panelWidth = min(400, width * 0.8);
    const panelHeight = min(300, height * 0.6);
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;

    const closeButtonBounds = closeInstructionsButton.elt.getBoundingClientRect();
    const isClickOnCloseButton = (
      mouseX >= closeButtonBounds.left &&
      mouseX <= closeButtonBounds.right &&
      mouseY >= closeButtonBounds.top &&
      mouseY <= closeButtonBounds.bottom
    );

    const isClickOutsidePanel = !(
      mouseX >= panelX &&
      mouseX <= panelX + panelWidth &&
      mouseY >= panelY &&
      mouseY <= panelY + panelHeight
    );

    const aboutButtonBounds = aboutButton.elt.getBoundingClientRect();
    const isClickOnAboutButton = (
      mouseX >= aboutButtonBounds.left &&
      mouseX <= aboutButtonBounds.right &&
      mouseY >= aboutButtonBounds.top &&
      mouseY <= aboutButtonBounds.bottom
    );

    if (isClickOnCloseButton || (isClickOutsidePanel && !isClickOnAboutButton)) {
      showInstructions = false;
      closeInstructionsButton.hide();
    }
  }
}

function toggleLabels() {
  showLabels = !showLabels;
  isPaused = showLabels;

   if (showLabels) {
    isPaused = true;
  } else {
    isPaused = false;
  }
}

function drawLabelsOverlay() {
  let safeMarginX = width * 0.15;
  let safeMarginY = height * 0.15;
  let safeZone = {
    xMin: safeMarginX,
    xMax: width - safeMarginX,
    yMin: safeMarginY,
    yMax: height - safeMarginY
  };

  function isInsideSafeZone(x, y) {
    return x >= safeZone.xMin && x <= safeZone.xMax &&
         y >= safeZone.yMin && y <= safeZone.yMax;
}

  fill(255, 255, 255, 76); // 30% opacity
  noStroke();
  rect(0, 0, width, height);

  let data = currentDay === 0 ? weatherData : forecastData[currentDay - 1];
  if (!data) return;

  textSize(18);
  textAlign(CENTER, CENTER);
  fill(colors.labelText);
  noStroke();

  //UV Index Label
  let uvLabelX = width * 0.75;
  let uvLabelY = height * 0.3 - 50;
  fill(colors.labelBg);
  let uvW = textWidth("UV Index") + 20;
  rect(uvLabelX - uvW / 2, uvLabelY - 15, uvW, 30, 5);
  fill(colors.labelText);
  text("UV Index", uvLabelX, uvLabelY);

  // Cloud Cover Label
  if (cloudImg && clouds.length > 0) {
    let closestCloud = clouds[0];
    let minDist = dist(width / 2, height / 2, closestCloud.x, closestCloud.y);

    for (let i = 1; i < clouds.length; i++) {
      let d = dist(width / 2, height / 2, clouds[i].x, clouds[i].y);
      if (d < minDist) {
        minDist = d;
        closestCloud = clouds[i];
      }
    }

    // Check if this cloud is currently visible on screen
    if (closestCloud.x >= 0 && closestCloud.x <= width && closestCloud.y >= 0 && closestCloud.y <= height) {
      let cloudLabelX = closestCloud.x;
      let cloudLabelY = closestCloud.y - 40;
      fill(colors.labelBg);
      let cw = textWidth("Cloud Cover") + 20;
      rect(cloudLabelX - cw / 2, cloudLabelY - 15, cw, 30, 5);
      fill(colors.labelText);
      text("Cloud Cover", cloudLabelX, cloudLabelY);
    }
  }

  // Temperature Label
  let tempLabelX = tempBlob.x;
  let tempLabelY = tempBlob.y - tempBlob.baseRadius - 20;
  fill(colors.labelBg);
  let tw = textWidth("Temperature") + 20;
  rect(tempLabelX - tw / 2, tempLabelY - 15, tw, 30, 5);
  fill(colors.labelText);
  text("Temperature", tempLabelX, tempLabelY);

  // Wind Label
  if (windParticles.length > 0) {
    let windIndex = min(5, windParticles.length - 1);
    let wind = windParticles[windIndex];
    let windLabelX = wind.x + 50;
    let windLabelY = wind.y - 20;

    stroke(colors.labelText);
    strokeWeight(1);
    line(windLabelX - 40, windLabelY + 10, wind.x, wind.y);

    let angle = atan2(wind.y - (windLabelY + 10), wind.x - (windLabelX - 40));
    push();
    translate(wind.x, wind.y);
    rotate(angle);
    line(0, 0, -10, -5);
    line(0, 0, -10, 5);
    pop();

    noStroke();
    fill(colors.labelBg);
    let ww = textWidth("Wind Speed/Direction") + 20;
    rect(windLabelX - ww / 2, windLabelY - 15, ww, 30, 5);
    fill(colors.labelText);
    text("Wind Speed/Direction", windLabelX, windLabelY);
  }

  // Visibility Label
  if (data.visibility && data.visibility < 10000) {
  let visLabelText = "Visibility (mask applied)";
  let visLabelX = width - 100;
  let visLabelY = height - 100;

  // Ensure it stays inside 70% center-safe zone
  let safeMinX = width * 0.15;
  let safeMaxX = width * 0.85;
  visLabelX = constrain(visLabelX, safeMinX, safeMaxX);

  fill(colors.labelBg);
  textFont(nimbusSansLight);
  textSize(16);
  let vw = textWidth(visLabelText) + 24;
  rect(visLabelX - vw / 2, visLabelY - 18, vw, 36, 6);

  fill(colors.labelText);
  textAlign(CENTER, CENTER);
  text(visLabelText, visLabelX, visLabelY);

  // Draw connector to corner where the mask is visually applied
  stroke(colors.labelText);
  strokeWeight(1);
  let maskVisualX = width - 20;
  let maskVisualY = height - 20;
  line(visLabelX, visLabelY + 12, maskVisualX, maskVisualY);

  let angle = atan2(maskVisualY - (visLabelY + 12), maskVisualX - visLabelX);
  push();
  translate(maskVisualX, maskVisualY);
  rotate(angle);
  line(0, 0, -10, -5);
  line(0, 0, -10, 5);
  pop();

  noStroke();
}
}

function createInfoPanelButtons() {
  closeInstructionsButton = createButton('×');
closeInstructionsButton.size(30, 30);
closeInstructionsButton.style('font-size', '20px');
closeInstructionsButton.style('background', 'rgba(255, 255, 255, 0.3)');
closeInstructionsButton.style('border', 'none');
closeInstructionsButton.style('color', '#555');
closeInstructionsButton.style('border-radius', '50%'); // always a circle
closeInstructionsButton.style('width', '30px');
closeInstructionsButton.style('height', '30px');
closeInstructionsButton.style('text-align', 'center');
closeInstructionsButton.style('line-height', '30px');
closeInstructionsButton.mousePressed(() => {
  showInstructions = false;
  closeInstructionsButton.hide();
});
closeInstructionsButton.hide();

// ✨ Add glow on hover
closeInstructionsButton.mouseOver(() => {
  closeInstructionsButton.style('box-shadow', '0 0 10px 5px rgba(135, 90, 255, 0.5)');
  closeInstructionsButton.style('background', 'rgba(255, 255, 255, 0.6)');
  closeInstructionsButton.style('color', '#000');
});

closeInstructionsButton.mouseOut(() => {
  closeInstructionsButton.style('box-shadow', 'none');
  closeInstructionsButton.style('background', 'rgba(255, 255, 255, 0.3)');
  closeInstructionsButton.style('color', '#555');
});


}
function createTempUnitButton() {
  tempUnitButton = createButton(units === 'metric' ? '°C' : '°F');
  tempUnitButton.mousePressed(toggleTempUnit);
  tempUnitButton.parent(topRightUI);
  tempUnitButton.style('font-size', '14px');
  tempUnitButton.style('background', `rgba(${colors.buttonBg.join(',')})`);
  tempUnitButton.style('border', 'none');
  tempUnitButton.style('color', '#000');
  tempUnitButton.style('font-family', 'nimbus-sans, sans-serif');
  tempUnitButton.style('font-weight', '300');
  tempUnitButton.style('padding', '8px 12px');
  tempUnitButton.style('border-radius', '15px');
  tempUnitButton.style('margin', '0 5px');

  tempUnitButton.mouseOver(() => {
    tempUnitButton.style('background-color', `rgba(${colors.buttonActive[0]}, ${colors.buttonActive[1]}, ${colors.buttonActive[2]}, 0.7)`);
    tempUnitButton.style('color', '#fff');
  });

  tempUnitButton.mouseOut(() => {
    tempUnitButton.style('background-color', `rgba(${colors.buttonBg.join(',')})`);
    tempUnitButton.style('color', '#000');
  });
}

function createMusicButton() {
  musicButton = createButton('UNMUTE');
  musicButton.mousePressed(toggleMusic);
  musicButton.parent(topRightUI);
  musicButton.style('font-size', '14px');
  musicButton.style('background', `rgba(${colors.buttonBg.join(',')})`);
  musicButton.style('border', 'none');
  musicButton.style('color', '#000');
  musicButton.style('font-family', 'nimbus-sans, sans-serif');
  musicButton.style('font-weight', '300');
  musicButton.style('padding', '8px 12px');
  musicButton.style('border-radius', '15px');
  musicButton.style('margin', '0 5px');
  
  // Add hover effect like day buttons
  musicButton.mouseOver(() => {
    musicButton.style('background-color', `rgba(${colors.buttonActive[0]}, ${colors.buttonActive[1]}, ${colors.buttonActive[2]}, 0.7)`);
    musicButton.style('color', '#fff');
  });
  
  musicButton.mouseOut(() => {
    musicButton.style('background-color', `rgba(${colors.buttonBg.join(',')})`);
    musicButton.style('color', '#000');
  });
}

function toggleMusic() {
  if (!bgMusic.isLoaded()) return;

  if (isMusicPlaying) {
    bgMusic.pause();
    // Also pause rain/snow if they're playing
    if (isRainPlaying && rainSound.isPlaying()) rainSound.pause();
    if (isSnowPlaying && snowSound.isPlaying()) snowSound.pause();
    isMusicPlaying = false;
    musicButton.html('UNMUTE');
  } else {
    bgMusic.loop();
    // Also resume rain/snow if they were playing
    if (isRainPlaying && !rainSound.isPlaying()) rainSound.loop();
    if (isSnowPlaying && !snowSound.isPlaying()) snowSound.loop();
    isMusicPlaying = true;
    musicButton.html('MUTE');
  }
}


function createInputElements() {
  let inputContainer = createDiv();
  inputContainer.id('input-container');
  inputContainer.style('position', 'absolute');
  inputContainer.style('top', '20px');
  inputContainer.style('left', '50%');
  inputContainer.style('transform', 'translateX(-50%)');
  inputContainer.style('display', 'flex');
  inputContainer.style('gap', '10px');
  inputContainer.style('align-items', 'center');
  
  cityInput = createInput(city);
  cityInput.size(200);
  cityInput.style('padding', '8px 12px');
  cityInput.style('border-radius', '20px');
  cityInput.style('border', `2px solid rgba(${colors.inputBorder.join(',')})`);
  cityInput.style('background-color', `rgba(${colors.inputBg.join(',')})`);
  cityInput.style('color', `rgba(${colors.inputText.join(',')})`);
  cityInput.style('font-size', '14px');
  cityInput.style('outline', 'none');
  cityInput.style('font-family', 'nimbus-sans, sans-serif');
  cityInput.style('font-weight', '300');
  
    suggestionBox = createDiv();
  suggestionBox.style('position', 'absolute');
  suggestionBox.style('top', '60px');
  suggestionBox.style('left', '50%');
  suggestionBox.style('transform', 'translateX(-50%)');
  suggestionBox.style('background', '#fff');
  suggestionBox.style('border', '1px solid #ccc');
  suggestionBox.style('border-radius', '10px');
  suggestionBox.style('font-family', 'nimbus-sans, sans-serif');
  suggestionBox.style('padding', '5px');
  suggestionBox.style('display', 'none');
  suggestionBox.style('z-index', '1000');

  cityInput.input(() => {
    let val = cityInput.value().toLowerCase();
    suggestionBox.html(""); // Clear old
    let matches = citySuggestions.filter(name => name.toLowerCase().startsWith(val)).slice(0, 5);

    if (val.length > 0 && matches.length > 0) {
      suggestionBox.style('display', 'block');
      matches.forEach(match => {
        let item = createDiv(match);
        item.parent(suggestionBox);
        item.style('padding', '5px');
        item.style('cursor', 'pointer');
        item.mousePressed(() => {
          cityInput.value(match);
          suggestionBox.style('display', 'none');
          city = match;
          fetchWeatherData();
        });
      });
    } else {
      suggestionBox.style('display', 'none');
    }
  });

  inputContainer.child(suggestionBox);

  submitButton = createButton('Get Weather');
  submitButton.size(120, 38);
  submitButton.mousePressed(() => {
    city = cityInput.value();
    fetchWeatherData();
  });
  submitButton.style('padding', '8px 12px');
  submitButton.style('border-radius', '20px');
  submitButton.style('border', 'none');
  submitButton.style('background-color', `rgba(${colors.buttonActive.join(',')})`);
  submitButton.style('color', 'white');
  submitButton.style('font-size', '14px');
  submitButton.style('cursor', 'pointer');
  submitButton.style('transition', 'all 0.2s');
  submitButton.style('font-family', 'nimbus-sans, sans-serif');
  submitButton.style('font-weight', '300');
  
  submitButton.mouseOver(() => {
    submitButton.style('background-color', `rgba(${colors.buttonActive[0]}, ${colors.buttonActive[1]}, ${colors.buttonActive[2]}, 0.8)`);
  });
  
  submitButton.mouseOut(() => {
    submitButton.style('background-color', `rgba(${colors.buttonActive.join(',')})`);
  });
  
  inputContainer.child(cityInput);
  inputContainer.child(submitButton);
    // Trigger weather fetch on Return key
  cityInput.input(() => {
    cityInput.elt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        city = cityInput.value();
        fetchWeatherData();
      }
    });
  });

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  tempBlob.baseRadius = width * 0.18;
  tempBlob.radiusVariation = width * 0.25;
  
  togglePanelButton.position(showLeftPanel ? leftPanelWidth : 0, height / 2);

  
  initVisualElements();
}

function createAboutButton() {
  aboutButton = createButton('ABOUT');
  aboutButton.mousePressed(() => {
    showInstructions = !showInstructions; // Toggle the panel state
    if (showInstructions) {
      closeInstructionsButton.show();
    } else {
      closeInstructionsButton.hide();
    }
  });
  aboutButton.parent(topRightUI);
  aboutButton.style('font-size', '14px');
  aboutButton.style('background', `rgba(${colors.buttonBg.join(',')})`);
  aboutButton.style('border', 'none');
  aboutButton.style('color', '#000');
  aboutButton.style('font-family', 'nimbus-sans, sans-serif');
  aboutButton.style('font-weight', '300');
  aboutButton.style('padding', '8px 12px');
  aboutButton.style('border-radius', '15px');
  aboutButton.style('margin', '0 5px');
  
  aboutButton.mouseOver(() => {
    aboutButton.style('background-color', `rgba(${colors.buttonActive[0]}, ${colors.buttonActive[1]}, ${colors.buttonActive[2]}, 0.7)`);
    aboutButton.style('color', '#fff');
  });
  
  aboutButton.mouseOut(() => {
    aboutButton.style('background-color', `rgba(${colors.buttonBg.join(',')})`);
    aboutButton.style('color', '#000');
  });
}

function draw() {
  let bgColor = weatherData?.coord ? getBackgroundColorForLatitude(weatherData.coord.lat) : color(colors.background);
  background(bgColor);  
if (weatherData && forecastData) {
    let currentMain = currentDay === 0
      ? weatherData.weather[0].main.toLowerCase()
      : forecastData[currentDay - 1].weather[0].main.toLowerCase();

    // Update sound states
    if (currentMain.includes("rain")) {
      if (!rainSound.isPlaying() && isMusicPlaying) rainSound.loop();
      if (snowSound.isPlaying()) snowSound.stop();
      isRainPlaying = true;
      isSnowPlaying = false;
    } else if (currentMain.includes("snow")) {
      if (!snowSound.isPlaying() && isMusicPlaying) snowSound.loop();
      if (rainSound.isPlaying()) rainSound.stop();
      isRainPlaying = false;
      isSnowPlaying = true;
    } else {
      if (rainSound.isPlaying()) rainSound.stop();
      if (snowSound.isPlaying()) snowSound.stop();
      isRainPlaying = false;
      isSnowPlaying = false;
    }
  }

  // Update transitions
  updateLeftPanelTransition();
  updateSliderTransitions();
  
  if (isLoading) {
    drawLoadingScreen();
    return;
  }
  
  if (weatherData && forecastData) {
    if (isTransitioning) {
      handleDayTransition();
    } else if (!isPaused) {
      drawWeatherVisualization(currentDay);
    } else {
      push();
      drawWeatherVisualization(currentDay);
      pop();
    }
    
    drawCityInfo();
  }
  
  if (weatherData && forecastData) {
  if (!isTransitioning && !isPaused) {
    updateLeftPanelContent();
  }
}

  drawDayIndicators();
  drawLeftPanel();
  
  if (!isLoading) {
  togglePanelButton.show();
} else {
  togglePanelButton.hide();
}
  
  if (showInstructions) {
  drawInstructionsPanel();
}

  if (showLabels) {
    drawLabelsOverlay();
  }
  if (errorMessage) {
  fill(255, 0, 0);
  textAlign(CENTER);
  textSize(16);
  textFont(nimbusSansLight);
  text(errorMessage, width / 2, height - 80);
}

}

function drawInstructionsPanel() {
  let panelWidth = min(400, width * 0.8);
  let panelHeight = min(300, height * 0.6);
  let panelX = (width - panelWidth) / 2;
  let panelY = (height - panelHeight) / 2;

  // Check if mouse is over the panel
  isMouseOverInstructions =
    mouseX >= panelX &&
    mouseX <= panelX + panelWidth &&
    mouseY >= panelY &&
    mouseY <= panelY + panelHeight;

  // Draw panel background
  fill(255);
  noStroke();
  rect(panelX, panelY, panelWidth, panelHeight, 15);

  closeInstructionsButton.position(panelX + panelWidth - 40, panelY + 10);
  closeInstructionsButton.show();

  // Panel content
  fill(colors.panelText);
  textAlign(CENTER, CENTER);
  textSize(28);
  textFont(marlidesDisplayPro);
  text("Weather Visualization Project", panelX + panelWidth / 2, panelY + 30);

  push();
  textAlign(LEFT, TOP);
  textSize(16);
  textFont(nimbusSansLight);
  textLeading(26);
  text(
    "This was created to show the inherent beauty of variation in weather data. By transforming real-time environmental information into an immersive, animated interface, this visualization turns numbers into sensations. Each city's forecast becomes its own sensory experience, inviting viewers to explore how invisible forces shape the mood of a place.",
    panelX + 30, panelY + 70, panelWidth - 60, panelHeight - 80
  );
  pop();
}

function drawWeatherInfoPanel() {
  let data = currentDay === 0 ? weatherData : forecastData[currentDay - 1];
  if (!data) return;
  
  let panelWidth = min(400, width * 0.8);
  let panelHeight = min(350, height * 0.7);
  let panelX = (width - panelWidth) / 2;
  let panelY = (height - panelHeight) / 2;
  
  fill(colors.panelBg);
  noStroke();
  rect(panelX, panelY, panelWidth, panelHeight, 15); 
  
  closeInfoButton.position(panelX + panelWidth - 40, panelY + 10);
  
  fill(colors.panelText);
  textFont(nimbusSansLight);
  textAlign(CENTER, CENTER);
  textSize(20);
  text(currentDay === 0 ? "Current Weather" : `Forecast for Day ${currentDay + 1}`, panelX + panelWidth/2, panelY + 30);
  
  textAlign(LEFT, TOP);
  textSize(16);
  
  let temp = data.main?.temp || 0;
  let feelsLike = data.main?.feels_like || 0;
  let humidity = data.main?.humidity || 0;
  let pressure = data.main?.pressure || 0;
  let windSpeed = data.wind?.speed || 0;
  let windDeg = data.wind?.deg || 0;
  let cloudCover = data.clouds?.all || 0;
  let visibility = data.visibility || 0;
  let uvi = daily.uvi || 0;
  
  let windDirection = getWindDirection(windDeg);
}

function drawWindArrow(speed, direction) {
  let arrowImg;

  if (speed <= 3.0) {
    arrowImg = windArrows.no;
  } else if (speed <= 7.7) {
    arrowImg = windArrows.mild;
  } else if (speed <= 13.5) {
    arrowImg = windArrows.moderate;
  } else {
    arrowImg = windArrows.strong;
  }

  if (!arrowImg) return;

  let angle = radians(direction + 180);  // Wind is FROM direction → rotate TO

  push();
  imageMode(CENTER);
  translate(250, 450);
  rotate(angle);
  image(arrowImg, 0, 0);  // 👈 Use original image scale
  pop();
}

function updateSliderTransitions() {
  tempSliderCurrent = lerp(tempSliderCurrent, tempSliderTarget, sliderTransitionSpeed);
  leftPanelContent.temperature.value = tempSliderCurrent;
  
  visibilitySliderCurrent = lerp(visibilitySliderCurrent, visibilitySliderTarget, sliderTransitionSpeed);
  leftPanelContent.visibility.value = visibilitySliderCurrent;
}

function updateLeftPanelTransition() {
  if (leftPanelTransitioning) {
    leftPanelTransitionProgress += leftPanelTransitionSpeed;
    
    if (leftPanelTransitionProgress >= 1) {
      leftPanelWidth = leftPanelTargetWidth;
      leftPanelTransitioning = false;
    } else {
      // Ease-in-out interpolation for smoother motion
      let t = leftPanelTransitionProgress;
t = -0.5 * (cos(PI * t) - 1);  // sine-based easing
      
      leftPanelWidth = lerp(
        showLeftPanel ? 0 : 370,
        leftPanelTargetWidth,
        t
      );
    }
     togglePanelButton.position(leftPanelWidth, height / 2);
  }
}

function updateLeftPanelContent() {
  let data = currentDay === 0 ? weatherData : forecastData[currentDay - 1];
  if (!data) return;

  // First update all non-UV values
  tempSliderTarget = data.main?.temp || 0;
  visibilitySliderTarget = data.visibility ? Math.min(data.visibility / 1000, 10) : 10;
  leftPanelContent.temperature.unit = units === 'metric' ? "°C" : "°F";
  leftPanelContent.cloudCover.value = data.clouds?.all || 0;
  leftPanelContent.wind.speed = data.wind?.speed || 0;
  leftPanelContent.wind.direction = data.wind?.deg || 0;
  
  // Update precipitation (rain or snow)
  let precipValue = 0;
  if (data.rain && data.rain["1h"]) {
    precipValue = data.rain["1h"];
  } else if (data.snow && data.snow["1h"]) {
    precipValue = data.snow["1h"];
  } else if (data.rain && data.rain["3h"]) {
    precipValue = data.rain["3h"] / 3;
  } else if (data.snow && data.snow["3h"]) {
    precipValue = data.snow["3h"] / 3;
  }
  
  // Convert units if needed
  if (units === 'imperial') {
    leftPanelContent.precipitation.value = precipValue * 0.0393701; // mm to inches
    leftPanelContent.precipitation.unit = "in";
  } else {
    leftPanelContent.precipitation.value = precipValue;
    leftPanelContent.precipitation.unit = "mm";
  }

  // Calculate new UV estimate without resetting display value
  let tempCelsius = units === 'metric'
    ? data.main?.temp || 0
    : (data.main?.temp - 32) * 5 / 9;

  let visKm = data.visibility ? Math.min(data.visibility / 1000, 10) : 10;

  let tempScore = map(tempCelsius, -5, 35, 0, 1);
  let visScore = map(visKm, 0, 10, 0, 1);
  let uvEstimate = 1 + 9 * constrain(0.6 * tempScore + 0.4 * visScore, 0, 1);
  let roundedUV = round(uvEstimate);

  // Only update the display value if it changed significantly
  if (abs(roundedUV - previousUVValue) >= 1) {
    leftPanelContent.uv.value = roundedUV;
    previousUVValue = roundedUV;
  }
}

function getWindDirection(degrees) {
  if (degrees >= 337.5 || degrees < 22.5) return "N";
  if (degrees < 67.5) return "NE";
  if (degrees < 112.5) return "E";
  if (degrees < 157.5) return "SE";
  if (degrees < 202.5) return "S";
  if (degrees < 247.5) return "SW";
  if (degrees < 292.5) return "W";
  return "NW";
}

function getUVIndexLevel(uvi) {
  if (uvi < 3) return "Low";
  if (uvi < 6) return "Moderate";
  if (uvi < 8) return "High";
  if (uvi < 11) return "Very High";
  return "Extreme";
}

function estimateVisibility(humidity, cloudCover) {
  let baseVisibility = 10000;

  if (humidity > 90 || cloudCover > 90) return 800;  // Very low
  if (humidity > 75 || cloudCover > 75) return 2000; // Low
  if (humidity > 60 || cloudCover > 60) return 4000; // Medium
  if (humidity > 45 || cloudCover > 45) return 7000; // Light
  return baseVisibility;
}

function handleDayTransition() {
  transitionProgress = min(transitionProgress + 0.1, 1);
  
  push();
  drawingContext.globalAlpha = 1 - transitionProgress;
  drawWeatherVisualization(currentDay);
  pop();
  
  push();
  drawingContext.globalAlpha = transitionProgress;
  drawWeatherVisualization(targetDay);
  pop();
  
  if (transitionProgress >= 1) {
    currentDay = targetDay;
    isTransitioning = false;
    transitionProgress = 0;
  }
}

function drawLoadingScreen() {
  togglePanelButton.hide(); 
  background(colors.background);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(24);
  textFont(nimbusSansLight);
  text("Loading weather data for " + city + "...", width/2, height/2);
}

/* UNCHANGED VISUAL ELEMENTS INIT */
function initVisualElements() {
  clouds = [];
  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: random(width),
      y: random(height * 0.4),
      size: random(0.3, 0.7),
      speed: random(0.2, 0.8),
      alpha: random(150, 220)
    });
  }
  
  windParticles = [];
  for (let i = 0; i < 50; i++) {
    let randomColor = random(colors.windParticles);
    windParticles.push({
      x: random(width),
      y: random(height),
      size: random(3, 12),
      speed: random(0.5, 2),
      life: random(100),
      lifeSpeed: random(0.1, 0.5),
      color: randomColor,
      rotation: random(TWO_PI),
      rotationSpeed: random(-0.02, 0.02)
    });
  }
  
  tempBlob.noiseOffset = random(1000);
  tempBlob.trail = [];
}

function updateTempBlob(temp) {
  // Always convert to Celsius for consistent coloring
  let celsiusTemp = units === 'metric' ? temp : (temp - 32) * 5 / 9;

    tempBlob.baseRadius = width * 0.18 * map(abs(celsiusTemp), 0, 40, 0.8, 1.2);

  if (celsiusTemp < 0) {
    tempBlob.color = colors.tempCold;
  } else if (celsiusTemp < 10) {
    let lerpAmt = map(celsiusTemp, 0, 10, 0, 1);
    tempBlob.color = lerpColor(
      color(colors.tempCold),
      color(colors.tempCool),
      lerpAmt
    ).levels;
  } else if (celsiusTemp < 20) {
    let lerpAmt = map(celsiusTemp, 10, 20, 0, 1);
    tempBlob.color = lerpColor(
      color(colors.tempCool),
      color(colors.tempWarm),
      lerpAmt
    ).levels;
  } else {
    let lerpAmt = map(celsiusTemp, 20, 30, 0, 1);
    tempBlob.color = lerpColor(
      color(colors.tempWarm),
      color(colors.tempHot),
      lerpAmt
    ).levels;
  }

  tempBlob.speed = map(celsiusTemp, -10, 30, 2, 6);
}


function drawWeatherVisualization(dayIndex) {
  let data = dayIndex === 0 ? weatherData : forecastData[dayIndex - 1];
  if (!data || !data.main || !data.wind || !data.clouds) return;
  
  drawUVOrb();
  drawCloudCover(data.clouds.all || 0, data.wind.speed || 0, data.wind.deg || 0);
  drawTemperatureBlob(data.main.temp || 20);
  drawWindParticles(data.wind.speed || 0, data.wind.deg || 0);
  drawVisibilityMask(data.visibility || 10000);
}

function drawTemperatureBlob(temp) {
  updateTempBlob(temp);
  if (!isPaused) {
    moveBlob();
  }
  drawBlobTrail();
  drawBlobShape();
}

function drawUVOrb() {
  if (!uvOrbImg) return;
  
  // Get UV value from leftPanelContent instead of parameter
  let displayUvi = leftPanelContent.uv.value === 0 ? 1 : leftPanelContent.uv.value;
  
  // Scale size linearly from 10% at UVI 1 to 100% at UVI 10
  let orbSize = map(displayUvi, 1, 10, width * 0.1, width * 1.0);
  
  // Add pulsing effect when not paused
  let pulseAmount = orbSize * 0.05; // 5% of current size
  let pulseFactor = isPaused ? 0 : sin(frameCount * 0.03);
  orbSize += pulseAmount * pulseFactor;
  
  let orbX = width * 0.75;
  let orbY = height * 0.3;
  let opacity = isPaused ? 1.0 : map(sin(frameCount * 0.05), -1, 1, 0.7, 1.0);
  
  push();
  tint(255, opacity * 255);
  imageMode(CENTER);
  image(uvOrbImg, orbX, orbY, orbSize, orbSize);
  pop();
}

function moveBlob() {
  if (tempBlob.direction === "right") {
    tempBlob.x += tempBlob.speed;
  } else {
    tempBlob.x -= tempBlob.speed;
  }

  let points = [];
  for (let theta = 0; theta < TWO_PI; theta += radians(5)) {
    let r = tempBlob.baseRadius + map(
      noise(
        tempBlob.roundness + tempBlob.roundness * cos(theta), 
        tempBlob.roundness + tempBlob.roundness * sin(theta), 
        tempBlob.noiseOffset
      ), 
      0, 1, 
      -tempBlob.radiusVariation, 
      tempBlob.radiusVariation
    );
    points.push({
      x: tempBlob.x + r * cos(theta),
      y: tempBlob.y + r * sin(theta)
    });
  }
  tempBlob.trail.push(points);
  
  if (tempBlob.trail.length > tempBlob.maxTrailLength) {
    tempBlob.trail.shift();
  }
  if (tempBlob.x > width + tempBlob.baseRadius + 50 && tempBlob.direction === "right") {
    tempBlob.direction = "left";
    tempBlob.y = random(height);
    tempBlob.color = color(random(20), random(20), random(20)).levels;
  } else if (tempBlob.x < -tempBlob.baseRadius - 50 && tempBlob.direction === "left") {
    tempBlob.direction = "right";
    tempBlob.y = random(height);
    tempBlob.color = color(random(20), random(20), random(20)).levels;
  }
  
  tempBlob.noiseOffset += 0.01;
}

function drawBlobTrail() {
  noFill();
  stroke(tempBlob.color[0], tempBlob.color[1], tempBlob.color[2], 60);
  strokeWeight(2); // Increased from 1
  
  for (let i = 0; i < tempBlob.trail.length; i++) {
    let points = tempBlob.trail[i];
    beginShape();
    for (let p of points) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
  }
}

function drawBlobShape() {
  noFill();
  stroke(tempBlob.color[0], tempBlob.color[1], tempBlob.color[2], 220); // Increased opacity
  strokeWeight(3); // Increased from 1
  
  beginShape();
  for (let theta = 0; theta < TWO_PI; theta += radians(1)) {
    let r = tempBlob.baseRadius + map(
      noise(
        tempBlob.roundness + tempBlob.roundness * cos(theta), 
        tempBlob.roundness + tempBlob.roundness * sin(theta), 
        tempBlob.noiseOffset
      ), 
      0, 1, 
      -tempBlob.radiusVariation, 
      tempBlob.radiusVariation
    );
    vertex(tempBlob.x + r * cos(theta), tempBlob.y + r * sin(theta));
  }
  endShape(CLOSE);
}

function drawVisibilityMask(visibility) {
  let maskToUse = null;

  if (visibility >= 10000) return;
  else if (visibility >= 5000) maskToUse = visibilityMasks.light;
  else if (visibility >= 2000) maskToUse = visibilityMasks.medium;
  else if (visibility >= 1000) maskToUse = visibilityMasks.low;
  else maskToUse = visibilityMasks.none;

  if (!maskToUse) return;

  push();
  imageMode(CORNER);
  image(maskToUse, 0, 0, width, height);
  pop();
}

function drawCloudCover(cloudPercent, windSpeed, windDir, isGrayscale = false) {
  let windX = isPaused ? 0 : cos(radians(windDir)) * windSpeed * 0.2;
  let windY = isPaused ? 0 : sin(radians(windDir)) * windSpeed * 0.2;
  
  let visibleClouds = map(cloudPercent, 0, 100, 1, clouds.length);
  
  push();
  if (isGrayscale) {
    drawingContext.filter = 'grayscale(100%)';
  }
  
  for (let i = 0; i < clouds.length; i++) {
    if (i > visibleClouds) continue;
    
    let cloud = clouds[i];
    cloud.x += windX;
    cloud.y += windY;
    
    if (cloud.x > width + 200) cloud.x = -200;
    if (cloud.x < -200) cloud.x = width + 200;
    if (cloud.y > height * 0.5) cloud.y = -100;
    if (cloud.y < -100) cloud.y = height * 0.5;
    
    let imgWidth = cloudImg.width * cloud.size;
    let imgHeight = cloudImg.height * cloud.size;
    
    tint(255, cloud.alpha);
    image(cloudImg, cloud.x, cloud.y, imgWidth, imgHeight);
  }
  
  pop();
  noTint();
}

function drawWindParticles(windSpeed, windDir) {
  let angle = radians(windDir);
  let weatherMain = (currentDay === 0 ? weatherData.weather[0].main : forecastData[currentDay - 1].weather[0].main);
  let isRain = weatherMain.toLowerCase().includes('rain');
  let isSnow = weatherMain.toLowerCase().includes('snow');

  for (let p of windParticles) {
    if (!isPaused) {
      p.x += cos(angle) * p.speed * windSpeed * 0.3;
      p.y += sin(angle) * p.speed * windSpeed * 0.3;
      
      // Update rotation for snowflakes
      if (isSnow) {
        p.rotation += p.rotationSpeed;
      }

      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.x = random(width);
        p.y = random(height);
        p.life = random(100);
      }
      p.life += p.lifeSpeed;
    }

    noStroke();
    let alpha = map(sin(radians(p.life)), -1, 1, 80, 200);

    if (isRain) {
      fill('#5ae6ff');
      drawRaindrop(p.x, p.y, p.size, angle, alpha); // Pass wind angle to raindrop
    } else if (isSnow) {
      fill(255, 255, 255, alpha);
      drawSnowflake(p.x, p.y, p.size, p.rotation); // Pass rotation to snowflake
    } else {
      fill(p.color[0], p.color[1], p.color[2], alpha);
      ellipse(p.x, p.y, p.size);
    }
  }
}

function drawDayIndicators() {
  let dayNames = ["Today", "Day 2", "Day 3", "Day 4", "Day 5"];
  let buttonWidth = min(120, width * 0.18);
  let buttonHeight = 30;
  let buttonMargin = 10;
  let startX = (width - (dayNames.length * buttonWidth)) / 2;
  let buttonY = height - 25 - buttonHeight; // updated for padding

  for (let i = 0; i < dayNames.length; i++) {
    let x = startX + i * (buttonWidth + buttonMargin);
    let isHovered = mouseX > x && mouseX < x + buttonWidth && 
                    mouseY > buttonY && mouseY < buttonY + buttonHeight;

    if (i === currentDay) {
      fill(colors.buttonActive);
    } else if (isHovered) {
      fill(colors.buttonActive[0], colors.buttonActive[1], colors.buttonActive[2], 100);
    } else {
      fill(colors.buttonBg);
    }

    noStroke();
    rect(x, buttonY, buttonWidth, buttonHeight, 15);

    fill(i === currentDay ? 255 : 0);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(dayNames[i], x + buttonWidth / 2, buttonY + buttonHeight / 2);

    if (isHovered && mouseIsPressed && !isTransitioning && !isLoading) {
      navigateToDay(i);
    }
  }
}

function navigateToDay(dayIndex) {
  if (dayIndex === currentDay || isTransitioning || isLoading) return;
  
  targetDay = dayIndex;
  isTransitioning = true;
  transitionProgress = 0;
  
  let data = dayIndex === 0 ? weatherData : forecastData[dayIndex - 1];
  if (data) {
    tempSliderTarget = data.main?.temp || 0;
    visibilitySliderTarget = data.visibility ? Math.min(data.visibility / 1000, 10) : 10;
    leftPanelContent.cloudCover.value = data.clouds?.all || 0;
    leftPanelContent.wind.speed = data.wind?.speed || 0;
    leftPanelContent.wind.direction = data.wind?.deg || 0;
  }
}
  
async function fetchWeatherData() {
  try {
    isLoading = true;
    errorMessage = "";

    let currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}&appid=${apiKey}`);
    if (!currentResponse.ok) throw new Error("Invalid city name");
    weatherData = await currentResponse.json();

    let forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${units}&appid=${apiKey}`);
    if (!forecastResponse.ok) throw new Error("Invalid forecast data");
    let forecast = await forecastResponse.json();

    // Process forecast data without UV API
    await processForecastData(forecast.list);

    // Update sliders
    tempSliderCurrent = weatherData.main?.temp || 0;
    tempSliderTarget = tempSliderCurrent;
    visibilitySliderCurrent = weatherData.visibility ? Math.min(weatherData.visibility / 1000, 10) : 10;
    visibilitySliderTarget = visibilitySliderCurrent;
    
    isLoading = false;
    updateLeftPanelContent(); // This will set the UV estimate
  } catch (error) {
    console.error("Error:", error);
    isLoading = false;
    errorMessage = "Couldn't load weather for this city. Please check the name.";
  }
}

async function processForecastData(forecastList) {
  forecastData = [];
  let days = {};
  
  // Group forecasts by day
  for (let item of forecastList) {
    let date = new Date(item.dt * 1000);
    let dayKey = date.toDateString();
    let today = new Date(weatherData.dt * 1000).toDateString();
    if (dayKey === today) continue;
    
    if (!days[dayKey]) days[dayKey] = [];
    days[dayKey].push(item);
  }
  
  // Take midday forecast for each day
  let dayCount = 0;
  for (let dayKey in days) {
    if (dayCount >= 4) break;
    let dayForecasts = days[dayKey];
    let middayIndex = floor(dayForecasts.length / 2);
    forecastData.push(dayForecasts[middayIndex]);
    dayCount++;
  }
}

function drawCityInfo() {
  if (!weatherData || !weatherData.name || !weatherData.coord) return;
  
  // Draw city name
  textFont(marlidesDisplayPro);
  textSize(48);
  textAlign(CENTER, CENTER);
  fill(50, 50, 50, 220);
  text(weatherData.name, width/2, height/2 - 20);
  
  // Draw coordinates
  textFont(nimbusSansLight);
  textSize(18);
  let coordText = `${weatherData.coord.lat.toFixed(2)}° N, ${weatherData.coord.lon.toFixed(2)}° E`;
  text(coordText, width/2, height/2 + 40);
}

  function drawRaindrop(x, y, size, windAngle, alpha) {
  push();
  translate(x, y);
  rotate(windAngle + 1.5 * PI); // Point in wind direction (add PI to flip)
  noStroke();
  fill('#5ae6ff');
  beginShape();
  vertex(0, -size / 2);
  bezierVertex(size / 2, 0, size / 2, size, 0, size);
  bezierVertex(-size / 2, size, -size / 2, 0, 0, -size / 2);
  endShape(CLOSE);
  pop();
}

function drawSnowflake(x, y, size, rotation) {
  push();
  translate(x, y);
  rotate(rotation); // Apply rotation
  stroke(255);
  strokeWeight(1);
  
  // Main arms
  for (let i = 0; i < 6; i++) {
    let angle = TWO_PI / 6 * i;
    let xEnd = cos(angle) * size;
    let yEnd = sin(angle) * size;
    line(0, 0, xEnd, yEnd);
    
    // Smaller secondary arms
    let midX = cos(angle) * size * 0.6;
    let midY = sin(angle) * size * 0.6;
    let perpAngle = angle + PI/2;
    line(midX, midY, midX + cos(perpAngle) * size * 0.2, midY + sin(perpAngle) * size * 0.2);
    line(midX, midY, midX - cos(perpAngle) * size * 0.2, midY - sin(perpAngle) * size * 0.2);
  }
  
  // Center circle
  noStroke();
  fill(255);
  ellipse(0, 0, size * 0.3);
  pop();
}
