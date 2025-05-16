class Blob {

  constructor(r0, dr, rn) {
    this.center = createVector(0, height / 2);
    // this.xPos = 0;
    // this.yPos = 0;
    this.clr = color(0);
    this.strk = color(255, 60);
    this.r0 = r0;
    this.dr = dr;
    this.rn = rn;
    this.dir = "right";
    this.speed = 3.9;
  }

  make() {

    fill(this.clr);
    stroke(this.strk);

    beginShape();
    for (var theta = 0, r; theta < TWO_PI; theta += radians(1)) {
      r = this.r0 + map(noise(this.rn + this.rn * cos(theta), this.rn + this.rn * sin(theta), t), 0, 1, -this.dr, this.dr);

      this.x = this.center.x + r * cos(theta);
      this.y = this.center.y + r * sin(theta);

      // ringArray.push(x, y);

      vertex(this.x, this.y);

    }
    endShape();

  }

  move() {
    // MOVE BLOB TO RIGHT

    if (this.dir === "right") {
      this.center.x = this.center.x + this.speed;
    } else if (this.dir === "left"){
      this.center.x = this.center.x - this.speed;
    }


    if ((this.center.x >= width + this.r0 + 50) && this.dir == "right") {
      this.clr = color(random(20), random(20), random(20));
      // this.clr = color(0, 0);
      this.center.y = random(height);
      this.dir = "left";
    } 
    
    if ((this.center.x <= -this.r0 - 50) && this.dir == "left") {
      this.clr = color(random(20), random(20), random(20));
      // this.clr = color(0, 0);
      this.center.y = random(height);
      this.dir = "right";
    } 

    
    t += 0.01;
  }

}
