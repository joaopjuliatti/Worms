//player movement
keysUsed = {}
document.onkeydown = function(e){
    keysUsed[e.keyCode] = e.type =='keydown'
  }
  document.onkeyup = function(e){
    keysUsed[e.keyCode] = e.type =='keydown'
}



//Initialization canvas and contex
const globalCanvas = document.createElement('canvas');
globalCanvas.width = 1000;
globalCanvas.height = 500;
document.getElementById('game-board').appendChild(globalCanvas);

const globalContex1 = globalCanvas.getContext('2d');



//GAME GENERAL
class Game{
    constructor(canvas){
        this.canvas = canvas;
        this.contex = canvas.getContext('2d');
        this.atomization = 500
        this.playerWidth = 20
        this.playerHeigth = 40
        this.gravity = 0.1
        this.drag = 0.1
        this.frames = 0;
        this.turn = 1
        this.teams = ['red','blue']
        this.worms = []

        this.playerInitX = [0,900]
        this.playerInitY = 400
    }
    start = () =>{
        this.gameArea = new GameArea(this.canvas,this.playerInitY+this.playerHeigth,500)
        this.gameArea.start()
        this.startWorms()
        this.drawTurnTime()
    }

    startWorms = () =>{
        for(let i =0;i<this.teams.length;i++){
            this.worms.push(new Worm(this.playerInitX[i],this.playerInitY,0,0,this.playerWidth,this.playerHeigth,this.teams[i],this.canvas))
            this.worms[i].start()
        }
        this.indWormInUse = Math.random()*this.worms.length
        this.wormInUse = this.worms[this.indWormInUse]
    }
    drawWorms = () =>{
        for(let i =0;i<this.worms.length;i++){
            this.worms[i].drawWorm()
        }
    }
    clear = () =>{
        this.contex.clearRect(0,0,this.canvas.width,this.canvas.height)
    }
    keysPressed = () =>{
        if(keysUsed[37]) this.wormInUse.moveLeft()
        if(keysUsed[39]) this.wormInUse.moveRight()
        if(keysUsed[32]) this.wormInUse.jump()
        if(keysUsed[90]) this.wormInUse.attack()
    }
    updateGame = () =>{
        if(this.frames % 600 === 0)
            this.passTurn()
        this.clear()
        this,this.keysPressed()
        this.gameArea.drawGameArea()
        this.wormInUse.newPos(0,this.gravity)
        if(this.checkIfTouchY(this.wormInUse)){
            this.wormInUse.y = this.wormInUse.previousY

            if(Math.abs(this.wormInUse.Vx)>0.5){
                this.wormInUse.Vx = this.wormInUse.Vx - Math.sign(this.wormInUse.Vx)*this.drag
            }
            else{
                this.wormInUse.Vx=0
            }

            if(Math.abs(this.wormInUse.Vy)<2){
                this.wormInUse.Vy=0;
            }
            else {
                this.wormInUse.Vy = -this.wormInUse.Vy*0.5
            }
        }
        this.drawWorms()
        this.frames++
        this.drawTurnTime()
    }
    interval = () =>{
        setInterval(this.updateGame,1)
    }
    checkIfTouchY = (worm) =>{
        const teste =this.gameArea.terrains.reduce((acc,terrain)=>{
            return acc || terrain.checkGroundOrTop(worm)
        },false) 
        return teste
    }
    passTurn = () =>{
        this.turn++
        this.nextWorm()
        this.frames = 0
        this.wormInUse.beginTurn()
    }   
    nextWorm = () =>{
        this.indWormInUse ++
        if(this.indWormInUse>=this.worms.length) this.indWormInUse = 0
        this.wormInUse = this.worms[this.indWormInUse]
    }
    drawTurnTime = () =>{
        this.contex.font = '30px Arial'
        this.contex.fillText(`${this.frames/100}`,400,100)

    }
}


//MAP TERRAIN AND BACKGROUND
class GameArea{
    constructor(canvas,initY,atomization){
        this.canvas = canvas;
        this.contex = canvas.getContext('2d');
        this.atomization = atomization;
        this.terrains = [];
        this.initY = initY;
    }
    start = () =>{
        const widthAtom = this.canvas.width/this.atomization
        const numberRows = (this.canvas.height - this.initY)/widthAtom
        for(let i = 0;i<this.atomization;i++){
            for(let j=0; j<numberRows;j++){
                this.terrains.push(new Terrain(0+i*widthAtom,this.initY+j*widthAtom,0,0,widthAtom+1,widthAtom+1,this.canvas))
            }
        }
        this.drawGameArea()
    }
    drawGameArea = () =>{
        this.contex.fillStyle = "black"
        this.contex.fillRect(0,0,1000,500);
        for(let i = 0;i<this.terrains.length;i++){
            this.terrains[i].draw();
        }
    }

}



//BASE FOR ANY PIECE
class Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.Vx = Vx;
        this.Vy = Vy;
        this.ax = 0;
        this.ay = 0;
        this.width = width;
        this.height = height;
        this.canvas = canvas;
        this.contex = canvas.getContext('2d')
        this.frames = 0;
        this.gravity = 0;
    }
    left = () =>{
        return this.x;
    }
    right = () =>{
        return this.x+this.width
    }
    top = () =>{
        return this.y
    }
    bottom = () =>{
        return this.y+ this.height
    }
    newPos = (ax,ay) =>{
        this.previousX = this.x
        this.previousY = this.y
        this.x += this.Vx
        this.y += this.Vy
        this.newVelocity(ax,ay)
    }
    newVelocity = (ax,ay) =>{
        this.Vx += this.ax
        this.Vy += this.ay
        this.newAceleration(ax,ay)
    }
    newAceleration = (ax,ay) =>{
        this.ay = ay;
        this.ax = ax;
    }
}


class Terrain extends Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
    }
    draw = () =>{
        this.contex.fillStyle = 'yellow'
        this.contex.fillRect(this.x,this.y,this.width,this.height);
    }
    checkGroundOrTop = (worm) =>{
        return (
            ( worm.bottom() > this.top() && worm.bottom() < this.bottom())||
            ( worm.top() < this.bottom() && this.top() < worm.top() )
        )  
      }
}


class Worm extends Component{
    constructor(x,y,Vx,Vy,width,height,team,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
        this.bullets = [];
        this.gravity = 0.1
        this.numberBullets = 3
        this.jumps = 2
        this.team = team
        this.front = 'right'
    }
    start = () =>{
        this.newPos(0,0)
        this.drawWorm()
    }
    drawWorm = () =>{
        this.contex.fillStyle = this.team
        this.contex.fillRect(this.x,this.y,this.width,this.height);
        this.frames++;   
        this.drawBullets()  
    }
    jump = () =>{
        if(this.jumps>0){
            this.Vy -= 1.5
            this.jumps--
        }
    }
    moveRight =() =>{


    }
    moveLeft =() =>{

        
    }
    attack = () =>{
        if(this.frames % 50 ===0 && this.numberBullets>0){
            this.bullets.push(new Bullet(this.x,this.y,10,-2,20,10,this.canvas))
            this.numberBullets--
        }
    }
    drawBullets =() =>{
        for(let i = 0;i<this.bullets.length;i++){
            this.bullets[i].newPos(0,this.gravity)
            this.bullets[i].drawBullet()
        }
    }
    beginTurn(){
        this.frames = 0;
        this.bullets =[];
        this.numberBullets=3;
        this.jumps = 2
    }

}

class Bullet extends Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
    }
    drawBullet = () =>{
        this.contex.fillStyle = 'pink'
        this.contex.fillRect(this.x,this.y,this.width,this.height);
    }

}

game = new Game(globalCanvas)

game.start()

game.interval()
