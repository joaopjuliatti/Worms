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
        this.playerInitX = 0
        this.playerInitY = 400
        this.atomization = 500
        this.playerWidth = 20
        this.playerHeigth = 40
        this.gravity = 0.1
        this.drag = 0.4
    }
    start = () =>{
        this.player = new Player(this.playerInitX,this.playerInitY,0,0,this.playerWidth,this.playerHeigth,this.canvas)
        this.gameArea = new GameArea(this.canvas,this.playerInitY+this.playerHeigth,500)
        this.gameArea.start()
        this.player.start()
    }
    clear = () =>{
        this.contex.clearRect(0,0,this.canvas.width,this.canvas.height)
    }
    updateGame = () =>{
        this.clear()
        this.gameArea.drawGameArea()
        this.player.newPos(0,this.gravity)
        if(this.checkIfTouchY(this.player)){
            this.player.y = this.player.previousY

            if(Math.abs(this.player.Vx)>1){
                this.player.Vx = this.player.Vx - Math.sign(this.player.Vx)*this.drag 
            }
            else{
                this.player.Vx=0
            }

            if(Math.abs(this.player.Vy)<2){
                this.player.Vy=0;
            }
            else {
                this.player.Vy = -this.player.Vy*0.5
            }
        }

        this.player.drawPlayer()
    }
    interval = () =>{
        setInterval(this.updateGame,2)
    }
    checkIfTouchY = (player) =>{
        const teste =this.gameArea.terrains.reduce((acc,terrain)=>{
            return acc || terrain.checkGroundOrTop(player)
        },false) 
        return teste
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
}


class Terrain extends Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
    }
    draw = () =>{
        this.contex.fillStyle = 'yellow'
        this.contex.fillRect(this.x,this.y,this.width,this.height);
    }
    checkGroundOrTop = (player) =>{
        return (
            ( player.bottom() > this.top() && player.bottom() < this.bottom())||
            ( player.top() < this.bottom() && this.top() < player.top() )
        )  
      }
}



class Player extends Component{
    constructor(x,y,Vx,Vy,width,height,canvas){
        super(x,y,Vx,Vy,width,height,canvas);
    }
    start = () =>{
        this.newPos(0,0)
        this.drawPlayer()
    }
    drawPlayer = () =>{
        this.contex.fillStyle = 'red'
        this.contex.fillRect(this.x,this.y,this.width,this.height);   
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

game = new Game(globalCanvas)

game.start()

game.interval()



//player movement
document.onkeydown = function(e){
    switch (e.keyCode) {
      case 37:
        game.player.Vx=-5
        break;
      case 39:
        game.player.Vx=+5
        break;
    case 32:
        game.player.Vy=-2
        break;     
    }
  }

  document.onkeyup = (e) =>{
      
  }



