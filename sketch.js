const gameStateChannel = "swinging_game_state";
const clickCountChannel = "swinging_click_count";

let dataServer;
let pubKey = "pub-c-5592e055-5861-49ea-92a3-3eec942359b9";
let subKey = "sub-c-a78b4314-73c4-4ecc-ab7c-c98eaf6c283c";
let secretKey = "sec-c-YjA4MjQyNDItNjhhYS00MGNjLWI3MDgtZjc5OWU4YmJlYWRl";

var url = new URL(window.location.href);
var owner = url.searchParams.get("owner");
var nickName = url.searchParams.get("nickName")


let GAME_STATE = 'ready'
let GAME_INFO = {} // {user1: 100}
let myCounter = 0

let IMG_PERSON

dataServer = new PubNub({
  subscribeKey: subKey,
  publishKey: pubKey,
  uuid: nickName,
  secretKey: secretKey,
  heartbeatInterval: 0,
});

function preload() {
  IMG_PERSON = loadImage('person.png')
}

function setup() {
  createCanvas(windowWidth - 5, windowHeight - 5);
  textAlign(CENTER, CENTER)
  imageMode(CENTER)
  frameRate(1);

  // listen for messages coming through the subcription feed on this specific channel. 
  dataServer.addListener({ message: readIncoming });
  if (owner) {
    startButton = createButton('Start Now')
    startButton.position(0, 0);
    startButton.mousePressed(function () {
      this.hide()
      GAME_STATE = 'start'
    });

    GAME_INFO[nickName] = 0

    dataServer.subscribe({ channels: [clickCountChannel] });
  } else {
    dataServer.subscribe({ channels: [gameStateChannel] });

    reportClickCount()
  }

}

function draw() {
  background(72, 182, 245);

  if (owner) {
    syncGameStateMessage()
  } else {
    reportClickCount()
  }

  drawSwingingPool()
}

function drawSwingingPool() {
  const w = width / 15
  strokeWeight(5)
  for (let i = 1; i < 15; i++) {
    line(i * w, 0, i * w, height)
  }

  // draw person
  Object.keys(GAME_INFO).forEach((nickName, i) => {
    const count = GAME_INFO[nickName]
    const d = map(count, 0, 240, 93, height)
    if (d == height) {
      noLoop()
      textSize(48)
      fill('red')
      noStroke()
      text(nickName + ' Win', width / 2, height / 2)
    }
    fill('red')

    let cx = i * w + w / 2
    let cy = height - d
    // ellipse(cx, cy, 10, 10)
    image(IMG_PERSON, cx, cy)

    fill(255)
    text(nickName, cx, 20)
  })

  if (GAME_STATE != 'start') {
    push()
    textSize(40)
    fill(255)
    text('Please wait...', width / 2, height / 2)
    pop()
  }

}

function mouseClicked() {
  if (GAME_STATE == 'start') {
    myCounter++

    if (owner) {
      GAME_INFO[nickName] = myCounter
    }
  }
}

// PubNub logic below
function syncGameStateMessage() {
  // Send Data to the server to draw it in all other canvases
  dataServer.publish({
    channel: gameStateChannel,
    message: {
      gameData: GAME_INFO,
      gameState: GAME_STATE
    },
  });
}

function reportClickCount() {
  dataServer.publish({
    channel: clickCountChannel,
    message: {
      count: myCounter
    },
  });
}


function readIncoming(inMessage) {
  // when new data comes in it triggers this function,
  // we call this function in the setup

  /*since an App can have many channels, we ensure that we are listening
  to the correct channel */

  let nickName = inMessage.publisher; // who sent the message

  if (owner && inMessage.channel == clickCountChannel) {
    console.log(nickName, inMessage.message.count);
    GAME_INFO[nickName] = inMessage.message.count
  }

  if (!owner && inMessage.channel == gameStateChannel) {
    GAME_INFO = inMessage.message.gameData
    GAME_STATE = inMessage.message.gameState
  }
}