
// VARIABLES *******************************************************************

const width = 10,
  shipStart = Math.pow(width, 2) - Math.round(width/2),
  startingLives = 3,
  konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13],
  codeCheckArr = [],
  alienStartingSpeed = 500,
  initAlienSpawnRate = 1500,
  levelUp = 2000
let shipIndex = shipStart,
  $overlayTitle,
  $overlaySubtitle,
  $overlayMsg,
  $startBtn,
  $gameBoard,
  $gameBoardMsg,
  $scoreDiv,
  $score,
  $livesDiv,
  $overlay,
  score = 0,
  lives = startingLives,
  $cells,
  shotDelay = false,
  shipActive = false,
  alienSpeed,
  alienSpawnRate,
  aliens = [],
  currentStep = 0,
  firstGame = true,
  level = 1,
  $highScrForm,
  $highScrInput,
  $submitBtn,
  scores = []


function init(){
  $gameBoard = $('#gameBoard')
  $gameBoardMsg = $('<div />').appendTo($('main')).addClass('gameBoardMsg')
  $overlay = $('#overlay')
  $scoreDiv = $('div.score').text('Score: ')
  $livesDiv = $('div.lives')
  scores = JSON.parse(localStorage.getItem('High Scores'))
  console.log(scores)

  $overlay.html('<h1>PewPewPew</h1>' +
    '<h2>Protect the planet!</h2>' +
    '<h3>Click Start or press Enter to play</h3>' +
    '<button class="startBtn">Start</button>' +
    '<form>' +
      '<input name="name" placeholder="Please enter your name."></input>' +
      '<button class="submit">Submit</button>' +
    '</form>')

  $highScrForm = $('form').hide()
  $highScrInput = $highScrForm.find('input')
  $submitBtn = $highScrForm.find('button.submit')

  $overlayTitle = $overlay.find('h1')
  $overlaySubtitle = $overlay.find('h2')
  $overlayMsg = $overlay.find('h3')
  $startBtn = $overlay.find('button.startBtn')
  startEvents()

  // Create a grid of cells on the gameboard
  for (let i=0;i<Math.pow(width, 2);i++){
    const $cell = $('<div />').css({
      'width': `calc(100%/${width})`,
      'height': `calc(100%/${width})`
    })
    $cell.addClass('cell').appendTo($gameBoard)
  }


  // Get array of each cell on the gameboard
  $cells = $('div.cell')

  $score = $('<span />').addClass('scoreDisplay').appendTo($scoreDiv)
}

function startEvents(){
  $startBtn.on('click', startGame)
  $(document).on('keyup', e => {
    if (e.keyCode === 13) startGame()
  })
}

// GAME START ******************************************************************

function startGame(){
  $overlay.hide()
  shipActive = true
  score = 0
  level = 1
  lives = startingLives
  aliens = []
  alienSpeed = alienStartingSpeed
  alienSpawnRate = initAlienSpawnRate

  // Check if this is the first game, and if it isn't clear all the aliens from the board
  if(!firstGame) Array.from($cells).forEach(cell => cell.classList.remove('alien'))
  // If it is the first game, start the spawn alien function, this only runs on the first game as it is recursive
  else spawnAlien()
  firstGame = false

  // Display the score and lives
  $score.text(score)
  updateLives()


  // Place player ship on initial cell
  moveShip()


  // Move the aliens
  alienMove()

  addEvents()
}

// EVENT LISTENERS *************************************************************

function addEvents(){
  //First clear previous events
  $(document).off()

  //When a key is pressed down...
  $(document).on('keydown', e => {
    keydownHandler(e)
  })

  $(document).on('keyup', e => {
    keyupHandler(e)
  })
}

// UPDATE LIVES ****************************************************************

function updateLives(){
  $livesDiv.empty()
  for(let i=0;i<lives;i++){
    const $lifeDiv = $('<div />').addClass('life')
    $lifeDiv.html('<img src="assets/images/player.png">')
    $livesDiv.append($lifeDiv)
  }
}

// SHIP MOVEMENT ***************************************************************

// Redraws the ship on the cell the player has moved it to
function moveShip(){
  $cells.eq(shipIndex).addClass('ship')
}

function cellCheck(index, className){
  return $cells.eq(index).hasClass(className)
}

// ALIENS **********************************************************************

// Randomly places an alien on one of the cells of the first row excluding the furthest cell on the right...
function spawnAlien(){
  if (shipActive){
    const alienIndex = Math.floor(Math.random() * (width - 1))
    console.log(alienIndex)
    //Check that the area is clear for an alien to spawn and move into
    if (!(cellCheck(alienIndex, 'alien') || cellCheck((alienIndex, 'alien') + 1) || cellCheck((alienIndex, 'alien') - 1))){
      // Alien object
      const alien = {
        'display': true,
        'index': alienIndex,
        'dir': 'right',
        'shotOdds': 0.05,
        'move': function(){
          const prevIndex = this.index
          let move
          // When the alien reaches the right edge...
          if (this.index%width === width-1 && Math.ceil((this.index/width)%2) === 1){
            // ...it moves down a row...
            this.index += width
            move = width
            // ...and reverses direction to left
            this.dir = 'left'
            // When the alien reaches the left edge...
          } else if (this.index%width === 0 && (this.index/width)%2 === 1){
            // ...it moves down a row...
            this.index += width
            move = width
            // ...and reverses direction to right
            this.dir = 'right'
            // While direction is right...
          } else if (this.dir === 'right'){
            // ...and the alien moves one cell right
            this.index ++
            move = 1
            // While direction is left...
          } else if (this.dir === 'left'){
            // ...the alien moves one cell left
            this.index --
            move = -1
          }
          // Check if the alien was blown up on the previous cell...
          if(cellCheck(prevIndex, 'explosion')){
            // ...update the score...
            updateScore(100)
            // ...and remove the alien from the game.
            this.display = false
            $cells.eq(this.index).removeClass('alien')
            $cells.eq(prevIndex).removeClass('alien')
          // If it wasn't blown up, then draw it on the next cell
          } else drawAlien(this, move)
          // Check if the alien has reached the bottom of the screen...
          if (this.index >= Math.pow(width, 2) - width){
            // ...and run the game over function if it is
            console.log(Math.pow(width, 2) - width)
            gameOver()
          }
        }
      }
      drawAlien(alien, 1)
      aliens.push(alien)
    }
  }
  setTimeout(spawnAlien, alienSpawnRate)
}

// Draws the alien on the next cell (n) and removes it from the current one (index)
function drawAlien(alien, n){
  if (alien.display){
    $cells.eq(alien.index - n).removeClass('alien')
    $cells.eq(alien.index).addClass('alien')
  }
}

// Alien randomly fires a shot
function alienShot(alien){
  const shotCheck = Math.random()
  if (shotCheck < alien.shotOdds && !$cells.eq(alien.index + 10).hasClass('alien') && alien.display){
    fireShot(alien.index, width, 60, 'alienShot')
  }
}

// ALIEN MOVE ******************************************************************

// Alien moves according to alienSpeed variable
function alienMove(){
  let moveTimer
  // The aliens only move while the player ship is active
  if(shipActive ){
    const liveAliens = aliens.filter(alien => alien.display)
    liveAliens.forEach(alien => {
      alienShot(alien)
      alien.move()
    })
    moveTimer = setTimeout(alienMove, alienSpeed)
  } else {
    clearInterval(moveTimer)
  }
}

function updateScore(points){
  // The player score is increased and updated...
  score += points
  $score.text(score)
  if (score%levelUp === 0 && alienSpeed > 50) {
    alienSpeed -= 50
    level += 1
    $gameBoardMsg.html(`<h3>Level ${level}</h3><h5>Alien speed up!</h5>`)
    setTimeout(() => {
      $gameBoardMsg.text('')
    }, 2000)
  }
}

// COLLISION DETECTION *********************************************************

function collision(shotIndex, shotType, dir, shotTimer){

  //ALIEN HIT
  // If a shot enters a cell with an alien in it...
  if(cellCheck(shotIndex, 'alien') && shotType === 'shot'){
    updateScore(100)
    // ...alien object's display property set to false
    const shotAlien = aliens[aliens.findIndex(alien => alien.index === shotIndex)]
    shotAlien.display = false
    // Remove the alien and shot from the cell...
    $cells.eq(shotIndex).removeClass('alien')
    $cells.eq(shotIndex).removeClass('shot')
    // ...replace it with the explosion sprite...
    explode(shotAlien.index)
    // ...and shot's progress towards the top of the screen ends
    clearInterval(shotTimer)
  }
  if(cellCheck(shotIndex, 'alien') && shotType === 'alienShot'){
    $cells.eq(shotIndex).removeClass('alienShot')
    clearInterval(shotTimer)
  }

  // PLAYER HIT
  if (cellCheck(shotIndex, 'ship') && shotType === 'alienShot'){
    pauseGame()
    explode(shipIndex)
    $cells.eq(shipIndex).removeClass('ship')
    $cells.eq(shotIndex).removeClass('alienShot')
    lives -= 1
    updateLives()
    if(lives === 0){
      setTimeout(() => {
        gameOver()
      }, 700)
    } else {
      let i = 3
      const lifeCountdown = setInterval(() => {
        $gameBoardMsg.text(i)
        i --
        if (i < 0) {
          shipIndex = shipStart
          resumeGame()
          clearInterval(lifeCountdown)
        }
      }, 1000)
    }
  }

  // SHOT COLLISION
  // NOT WORKING AS EXPECTED...
  if( cellCheck(shotIndex + dir, 'shot') && shotType === 'alienShot' ) {
    console.log('HIT', shotIndex)
    $cells.eq(shotIndex).removeClass('alienShot')
    clearInterval(shotTimer)
  }

}

// SHOT FUNCTION ***************************************************************

// Fires a shot from the indicated current position in the indicated direction:
function fireShot(shooterIndex, dir, shotSpeed, shotType = 'shot'){
  // The shot is initially placed where the shooter is
  let shotIndex = shooterIndex

  // Interval for the shot's movement
  const shotTimer = setInterval(() => {
    // The shot is placed on the row above or below its current position as directed...
    $cells.eq(shotIndex + dir).addClass(`${shotType}`)
    // ...removed from its current position...
    $cells.eq(shotIndex).removeClass(`${shotType}`)
    // ...and current position is reassigned to new position
    shotIndex += dir


    // When the shot has reached the end of the screen, or when a life has been lost...
    if (shotIndex<0 || shotIndex>Math.pow(width, 2) || !shipActive){
      // ...the movement timer stops...
      clearInterval(shotTimer)
      // ...and the shot is removed from the gameboard
      $cells.eq(shotIndex).removeClass(`${shotType}`)
    }

    // Check for collision
    collision(shotIndex, shotType, dir, shotTimer)
  }, shotSpeed)
}

// EXPLOSION SPRITE FUNCTION ***************************************************

function explode(index){
  $cells.eq(index).addClass('explosion')
  const explosionTimer = setInterval(() => {
    $cells.eq(index).attr('data-step', currentStep)
    currentStep = currentStep === 15 ? 0 : currentStep += 1
    if(currentStep === 0) {
      $cells.eq(index).removeClass('explosion')
      clearInterval(explosionTimer)
    }
  }, 30)
}

// EVENT HANDLERS **************************************************************

function keydownHandler(e){
  // On keydown the player ship is removed from its current cell
  $cells.eq(shipIndex).removeClass('ship')
  switch(e.keyCode){
    // If the key is the left arrow key, the current index is decreased
    case 37: if (shipIndex%width !== 0) shipIndex--
      break
    // If the key is the right arrow key, the current index is increased
    case 39: if (shipIndex%width !== width-1) shipIndex++
      break
    // If the spacebar is held down, then a shot is fired on an interval to prevent rapid presses
    case 32: if (shotDelay === false){
      shotDelay = setInterval(() => {
        fireShot(shipIndex, -width, 40)
      }, 500)
    }
      break
    case 80: pauseGame()
      $gameBoardMsg.text('PAUSED').addClass('pause')
      $(document).on('keydown', (e) => {
        if (e.keyCode === 80) {
          $gameBoardMsg.text('').removeClass('pause')
          resumeGame()
        }
      })
  }
  // The ship is redrawn on the current index
  moveShip()
}

function keyupHandler(e){
  // When the spacebar is let go...
  if (e.keyCode === 32){
    // ...the interval is cleared...
    clearInterval(shotDelay)
    // ...and shotDelay is reassigned as false to allow another shot
    shotDelay = false
  }
  codeCheck(e)
}

// STOPPING THE GAME ***********************************************************

function pauseGame(){
  shipActive = false
  $(document).off('keydown')
}

function resumeGame(){
  $gameBoardMsg.text('')
  shipActive = true
  moveShip()
  alienMove()
  addEvents()
}

function gameOver(){
  $(document).off('keyup')
  $overlayTitle.text('Game Over')
  $overlaySubtitle.text(`You scored ${score} points`)
  lives === 0 ? $overlayMsg.text('Your defences have been utterly defeated, because you didn\'t pew hard enough') : $overlayMsg.text('The aliens slipped past your front line and managed to take out your defences from within.')
  $startBtn.off().text('Play again')
  if (score > Math.min(...scores.map(score => score.score)) || scores.length < 10) {
    setHighScore()
  } else startEvents()
  $overlay.show()
  pauseGame()
}

function setHighScore(){
  $overlayMsg.text('That\'s a high score!')
  $startBtn.hide()
  $highScrForm.show()
  $highScrForm.on('submit', (e) => {
    formHandler(e)
  })
}

function formHandler(e){
  e.preventDefault()
  if($highScrInput.val() !== ''){
    $highScrInput.css('border', 'none')
    const newHighScr = {'name': $highScrInput.val(), 'score': score}
    scores.push(newHighScr)
    scores.sort((a, b) => b.score - a.score)
    if (scores.length > 10) scores.splice(10)
    localStorage.setItem('High Scores', JSON.stringify(scores))
    $highScrForm.hide()
    $startBtn.off().show()
    setTimeout(startEvents, 100)
  } else {
    $highScrInput.attr('placeholder', 'Blank high score names aren\'t allowed!')
      .css('border', 'solid 5px #f00')
  }
}

// CHEAT CODES *****************************************************************

function codeCheck(e){
  // Keycode is pushed to codeCheckArr
  codeCheckArr.push(e.keyCode)
  // this splice starts at 11 back from the end of the array and removes everything before it
  codeCheckArr.splice(-konamiCode.length - 1, codeCheckArr.length - konamiCode.length)
  // if the code is entered in correct sequence, the player gets 5 extra lives
  if (codeCheckArr.join('') === konamiCode.join('')){
    lives += 5
    updateLives()
  }
}

// DOM CONTENT EVENT LISTENER | INIT FUNCTION **********************************

$(() => {
  init()
})
