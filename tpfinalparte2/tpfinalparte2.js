// VARIABLES GLOBALES
let juego;
let imagenesJugador = [];
let imgCorazon;
let imgOrbeClaro;
let imgOrbeOscuro;
let imgBarra;
let imgFondoPerdiste;
let imgFondoGana;

function preload() {
  imgCorazon       = loadImage(IMG.corazon);
  imgOrbeClaro     = loadImage(IMG.orbebuena);
  imgOrbeOscuro    = loadImage(IMG.orbemala);
  imgBarra         = loadImage(IMG.barraenergia);
  imgFondoPerdiste = loadImage(IMG.fondoperdiste);
  imgFondoGana     = loadImage(IMG.fondogana);

  for (let i = 0; i < 4; i++) {
    imagenesJugador[i] = [];
  }

  imagenesJugador[0][0] = loadImage(IMG.protagonistaarriba1);
  imagenesJugador[0][1] = loadImage(IMG.protagonistaarriba2);
  imagenesJugador[0][2] = loadImage(IMG.protagonistaarriba3);

  imagenesJugador[1][0] = loadImage(IMG.protagonistaabajo1);
  imagenesJugador[1][1] = loadImage(IMG.protagonistaabajo2);
  imagenesJugador[1][2] = loadImage(IMG.protagonistaabajo3);

  imagenesJugador[2][0] = loadImage(IMG.protagonistaizquierda1);
  imagenesJugador[2][1] = loadImage(IMG.protagonistaizquierda2);
  imagenesJugador[2][2] = loadImage(IMG.protagonistaizquierda3);

  imagenesJugador[3][0] = loadImage(IMG.protagonistaderecha1);
  imagenesJugador[3][1] = loadImage(IMG.protagonistaderecha2);
  imagenesJugador[3][2] = loadImage(IMG.protagonistaderecha3);
}

function setup() {
  createCanvas(800, 400);
  juego = new Juego();
}

function draw() {
  background(10, 5, 30);
  juego.dibujar();
}

function keyPressed() {
  if (juego.estado === "contexto") {
    juego.estado = "instrucciones";
  } else if (juego.estado === "instrucciones") {
    juego.iniciar();
  } else if (key === 'r' || key === 'R') {
    juego.reiniciar();
  }
}

// ==========================================
// CLASE JUEGO — controlador principal
// ==========================================
class Juego {
  constructor() {
    this.jugador       = new Jugador(400, 200);
    this.orbesClaros   = [];
    this.orbesOscuros  = [];
    this.energia       = 0;
    this.tiempoTotal   = 60000;
    this.tiempoInicio  = millis();
    this.ultimoOrbe    = millis();
    this.intervaloOrbe = 2000;
    this.estado        = "contexto";
    this.vidas         = 2;
    this.causaPerdida  = "";
    this.tiempoFlash   = 0;
    this.crearOrbesOscuros();
  }

  dibujar() {
    if (this.estado === "contexto") {
      this.dibujarContexto();
      return;
    }
    if (this.estado === "instrucciones") {
      this.dibujarInstrucciones();
      return;
    }
    if (this.estado === "gana" || this.estado === "pierde") {
      this.dibujarPantallaFinal();
      return;
    }

    this.agregarOrbeClaro();
    this.controlarVelocidadOscuros();
    this.controlarColisiones();
    this.controlarEstado();

    for (let i = 0; i < this.orbesClaros.length; i++) {
      this.orbesClaros[i].dibujar();
    }
    for (let i = 0; i < this.orbesOscuros.length; i++) {
      this.orbesOscuros[i].dibujar();
    }
    this.jugador.dibujar();
    this.dibujarHUD();
    this.dibujarFlash();
  }

  crearOrbesOscuros() {
    for (let i = 0; i < 3; i++) {
      let x = random(50, 750);
      let y = random(60, 350);
      this.orbesOscuros.push(new OrbeOscuro(x, y));
    }
  }

  agregarOrbeClaro() {
    if (millis() - this.ultimoOrbe > this.intervaloOrbe) {
      let x = random(20, 780);
      let y = random(50, 380);
      this.orbesClaros.push(new OrbeClaro(x, y));
      this.ultimoOrbe = millis();
    }
  }

  controlarVelocidadOscuros() {
    let factor = map(this.energia, 0, 100, 1, 2.7);
    for (let i = 0; i < this.orbesOscuros.length; i++) {
      this.orbesOscuros[i].ajustarVelocidad(factor);
    }
  }

  controlarColisiones() {
    for (let i = 0; i < this.orbesClaros.length; i++) {
      let orbe = this.orbesClaros[i];
      if (orbe.visible) {
        let d = dist(this.jugador.posX, this.jugador.posY, orbe.posX, orbe.posY);
        if (d < (this.jugador.tamano / 2 + orbe.tamano / 2)) {
          orbe.recoger();
          this.energia = min(100, this.energia + 10);
        }
      }
    }
    for (let i = 0; i < this.orbesOscuros.length; i++) {
      let orbe = this.orbesOscuros[i];
      let d = dist(this.jugador.posX, this.jugador.posY, orbe.posX, orbe.posY);
      if (d < (this.jugador.tamano / 2 + orbe.tamano / 2)) {
        if (orbe.golpear()) {
          if (this.energia > 0) {
            this.energia = max(0, this.energia - 15);
          } else {
            this.vidas--;
            this.tiempoFlash = millis();
          }
        }
      }
    }
  }

  controlarEstado() {
    if (this.energia >= 100) {
      this.estado = "gana";
    }
    if (this.vidas <= 0) {
      this.estado = "pierde";
      this.causaPerdida = "vidas";
    }
    let tiempoRestante = this.tiempoTotal - (millis() - this.tiempoInicio);
    if (tiempoRestante <= 0 && this.estado === "jugando") {
      this.estado = "pierde";
      this.causaPerdida = "tiempo";
    }
  }

  dibujarFlash() {
    let duracionFlash = 500;
    let tiempoTranscurrido = millis() - this.tiempoFlash;
    if (this.tiempoFlash > 0 && tiempoTranscurrido < duracionFlash) {
      let alfa = map(tiempoTranscurrido, 0, duracionFlash, 150, 0);
      fill(220, 0, 0, alfa);
      noStroke();
      rect(0, 0, 800, 400);
    }
  }

  dibujarPantallaFinal() {
    if (this.estado === "pierde") {
      image(imgFondoPerdiste, 0, 0, 800, 400);
      fill(0, 0, 0, 120);
    } else {
      image(imgFondoGana, 0, 0, 800, 400);
      fill(0, 0, 0, 130);
    }
    noStroke();
    rect(0, 0, 800, 400);

    textAlign(CENTER, CENTER);

    if (this.estado === "gana") {
      fill(150, 255, 180);
      textSize(48);
      text("¡ESCAPASTE!", 400, 150);
      fill(220);
      textSize(18);
      text("Lograste romper el portal y volver a tu realidad.", 400, 215);
    } else {
      fill(220, 80, 80);
      textSize(48);
      text("PERDISTE", 400, 150);
      fill(220);
      textSize(18);
      let mensajePerdida = "";
      if (this.causaPerdida === "vidas") {
        mensajePerdida = "Las orbes oscuras te consumieron por completo.";
      } else {
        mensajePerdida = "El tiempo se acabó antes de cargar la energía.";
      }
      text(mensajePerdida, 400, 215);
    }

    fill(255);
    textSize(16);
    text("Presioná R para reiniciar", 400, 300);
  }

  reiniciar() {
    this.jugador      = new Jugador(400, 200);
    this.orbesClaros  = [];
    this.orbesOscuros = [];
    this.energia      = 0;
    this.vidas        = 2;
    this.causaPerdida = "";
    this.tiempoFlash  = 0;
    this.tiempoInicio = 0;
    this.ultimoOrbe   = 0;
    this.estado       = "contexto";
    this.crearOrbesOscuros();
  }

  iniciar() {
    this.tiempoInicio = millis();
    this.ultimoOrbe   = millis();
    this.estado       = "jugando";
  }

  dibujarContexto() {
    background(10, 5, 30);
    fill(0, 0, 0, 160);
    noStroke();
    rect(100, 60, 600, 280, 12);

    textAlign(CENTER, CENTER);

    fill(180, 220, 255);
    textSize(22);
    text("Odisea en el Hiperespacio", 400, 95);

    stroke(80, 80, 120, 150);
    strokeWeight(1);
    line(150, 135, 650, 135);
    noStroke();

    fill(210, 210, 240);
    textSize(15);
    text("Unos seres de luz te hablan por telepatía y te advierten\nque no podés sobrevivir mucho tiempo ahí.\nTe ofrecen dos formas de escapar.", 400, 185);

    fill(150, 255, 180);
    textSize(13);
    text("Elegiste: USAR ENERGÍA", 400, 265);

    let parpadeo = sin(millis() * 0.004) > 0;
    if (parpadeo) {
      fill(255, 220, 100);
      textSize(14);
      text("Presioná cualquier tecla para continuar", 400, 320);
    }
  }

  dibujarInstrucciones() {
    background(10, 5, 30);
    fill(0, 0, 0, 160);
    noStroke();
    rect(60, 20, 680, 360, 12);

    textAlign(CENTER, CENTER);

    fill(150, 255, 180);
    textSize(28);
    text("¿Cómo jugar?", 400, 65);

    stroke(100, 150, 255, 100);
    strokeWeight(1);
    line(100, 90, 700, 90);
    noStroke();

    fill(220);
    textSize(13);
    textAlign(LEFT, CENTER);
    text("→  Moverse:          WASD", 150, 118);
    text("→  Recolectá los orbes azules para cargar la barra de energía.", 150, 142);
    text("→  Esquivá los orbes rojos — te restan energía y vidas.", 150, 166);
    text("→  Llená la barra antes de que se acabe el tiempo.", 150, 190);
    text("→  Si perdés las 2 vidas con la barra en 0, perdés.", 150, 214);
    text("→  Reiniciar:        R", 150, 238);

    let parpadeo = sin(millis() * 0.004) > 0;
    if (parpadeo) {
      fill(255, 220, 100);
      textSize(14);
      text("Presioná cualquier tecla para comenzar", 400, 378);
    }
  }

  dibujarHUD() {
    let anchoMarco = 350;
    let altoMarco  = 88;
    let xMarco     = 220;
    let yMarco     = 0;
    image(imgBarra, xMarco, yMarco, anchoMarco, altoMarco);

    let orbesActivos  = floor(map(this.energia, 0, 100, 0, 10));
    let tamanoOrbeHUD = 32;
    let espacioOrbe   = 22;
    let inicioX       = xMarco + 65;
    let centroY       = yMarco + 48;

    for (let i = 0; i < 10; i++) {
      if (i < orbesActivos) {
        tint(255);
      } else {
        tint(35, 35, 60);
      }
      imageMode(CENTER);
      image(imgOrbeClaro, inicioX + i * espacioOrbe, centroY, tamanoOrbeHUD, tamanoOrbeHUD);
      imageMode(CORNER);
    }
    noTint();

    fill(255);
    noStroke();
    textSize(13);
    textAlign(RIGHT, CENTER);
    let segundosRestantes = max(0, ceil((this.tiempoTotal - (millis() - this.tiempoInicio)) / 1000));
    text("TIEMPO: " + segundosRestantes + "s", 790, 20);

    for (let i = 0; i < 2; i++) {
      if (i < this.vidas) {
        tint(255);
      } else {
        tint(60, 60, 60);
      }
      image(imgCorazon, 10 + i * 32, 6, 26, 26);
    }
    noTint();
  }
}

// ==========================================
// CLASE JUGADOR
// ==========================================
class Jugador {
  constructor(x, y) {
    this.posX              = x;
    this.posY              = y;
    this.tamano            = 80;
    this.velocidad         = 4;
    this.direccion         = 1;
    this.frameActual       = 0;
    this.tiempoUltimoFrame = 0;
    this.intervaloFrame    = 150;
    this.enMovimiento      = false;
  }

  dibujar() {
    this.mover();
    imageMode(CENTER);
    image(imagenesJugador[this.direccion][this.frameActual], this.posX, this.posY, this.tamano, this.tamano);
    imageMode(CORNER);
  }

  mover() {
    this.enMovimiento = false;

    if (keyIsDown(87)) { this.posY -= this.velocidad; this.direccion = 0; this.enMovimiento = true; }
    if (keyIsDown(83)) { this.posY += this.velocidad; this.direccion = 1; this.enMovimiento = true; }
    if (keyIsDown(65)) { this.posX -= this.velocidad; this.direccion = 2; this.enMovimiento = true; }
    if (keyIsDown(68)) { this.posX += this.velocidad; this.direccion = 3; this.enMovimiento = true; }

    this.posX = constrain(this.posX, this.tamano / 2, 800 - this.tamano / 2);
    this.posY = constrain(this.posY, this.tamano / 2, 400 - this.tamano / 2);

    if (this.enMovimiento) {
      if (millis() - this.tiempoUltimoFrame > this.intervaloFrame) {
        this.frameActual = (this.frameActual + 1) % 3;
        this.tiempoUltimoFrame = millis();
      }
    } else {
      this.frameActual = 0;
    }
  }
}

// ==========================================
// CLASE ORBE CLARO — se recoge para ganar energía
// ==========================================
class OrbeClaro {
  constructor(x, y) {
    this.posX            = x;
    this.posY            = y;
    this.tamano          = 60;
    this.visible         = true;
    this.recogido        = false;
    this.tiempoVida      = 4000;
    this.tiempoNacimiento = millis();
  }

  dibujar() {
    if (!this.visible) return;
    this.actualizar();
    imageMode(CENTER);
    image(imgOrbeClaro, this.posX, this.posY, this.tamano, this.tamano);
    imageMode(CORNER);
  }

  actualizar() {
    if (millis() - this.tiempoNacimiento > this.tiempoVida) {
      this.visible = false;
    }
  }

  recoger() {
    this.visible  = false;
    this.recogido = true;
  }
}

// ==========================================
// CLASE ORBE OSCURO — se mueve y resta energía
// ==========================================
class OrbeOscuro {
  constructor(x, y) {
    this.posX              = x;
    this.posY              = y;
    this.tamano            = 38;
    this.velocidad         = 2;
    this.tiempoUltimoGolpe = 0;

    if (random() > 0.5) {
      this.direccionX = 1;
    } else {
      this.direccionX = -1;
    }
    if (random() > 0.5) {
      this.direccionY = 1;
    } else {
      this.direccionY = -1;
    }
  }

  dibujar() {
    this.mover();
    imageMode(CENTER);
    image(imgOrbeOscuro, this.posX, this.posY, this.tamano, this.tamano);
    imageMode(CORNER);
  }

  mover() {
    this.posX += this.direccionX * this.velocidad;
    this.posY += this.direccionY * this.velocidad;
    if (this.posX < this.tamano / 2 || this.posX > 800 - this.tamano / 2) {
      this.direccionX *= -1;
    }
    if (this.posY < this.tamano / 2 || this.posY > 400 - this.tamano / 2) {
      this.direccionY *= -1;
    }
  }

  ajustarVelocidad(factor) {
    this.velocidad = 1.6 * factor;
  }

  golpear() {
    if (millis() - this.tiempoUltimoGolpe > 1000) {
      this.tiempoUltimoGolpe = millis();
      return true;
    }
    return false;
  }
}
