import { Reader } from './common'
import { Charts } from './charts'
import { keyBind } from './keyBind'
import { Screen } from './screen'
const fileReader = new Reader(document.body)

fileReader.then(buffer => {
  new Chip8(buffer)
})

class Chip8{
  memory = new Uint8Array(4096)
  v = new Uint8Array(16)
  i = 0
  pCount = 512
  opCode = 0
  screen = new Screen(10, document.body)
  stack: number[] = []
  stackTop = 0
  gfx = new Array(64 * 32).fill(0)
  delayTimer = 0
  soundTimer = 0
  keys = []
  keyBind = keyBind
  drawFlag = false

  constructor(buffer: Uint8Array) {
    for (let i = 0; i < buffer.length; i ++) {
      this.memory[512 + i] = buffer[i]
    }
    for (let i = 0; i < Charts.length; i++) {
      this.memory[i] = Charts[i]
    }
    // this.canvas.width = 64
    // this.canvas.height = 32
    // this.canvas.tabIndex = 0
    // this.ctx.fillStyle = "rgb(0,0,0)";
    // this.ctx.fillRect(0, 0, 64, 32)
    document.body.addEventListener('keydown', (event) => {
      const keyStatus = keyBind[event.key]
      if (keyStatus) {
        keyStatus.status = 1
      }
    })
    document.body.addEventListener('keyup', (event) => {
      const keyStatus = keyBind[event.key]
      if (keyStatus) {
        keyStatus.status = 0
      }
    })
    let timer = setInterval(() => {
      try{
        this.keys = Object.values(keyBind).filter(key => key.status === 1).map(key => key.code)
        this.parseCode()
        if (this.delayTimer) {
          this.delayTimer -= 1
        }
        if (this.soundTimer) {
          this.soundTimer -= 1
        }
        this.render()
      }catch(e) {
        clearInterval(timer)
      }
    }, 8) 
  }

  getOpNumber(num: number) {
    return this.opCode & num
  }

  parseCode() {
  
    this.opCode = this.memory[this.pCount] << 8 | this.memory[this.pCount + 1]
    const order = this.getOpNumber(0xf000)
    if (this.opCode === 0xee) {
      this.pCount = this.stack[this.stackTop]
      this.stackTop -= 1
      return
    }
    if (this.opCode === 0xe0) {
      this.gfx = new Array(64 * 32).fill(0)
      this.drawFlag = true
      this.pCount += 2 
      return
    }
    if (order === 0x6000) {
      const index = this.getOpNumber(0x0f00) >> 8
      const num = this.getOpNumber(0x00ff)
      this.v[index] = num
      this.pCount += 2
      return
    }
    if (order === 0x7000) {
      const index = this.getOpNumber(0x0f00) >> 8
      const num = this.getOpNumber(0x00ff)
      this.v[index] += num
      this.pCount += 2
      return
    }


    if (order === 0x1000) {
      this.pCount = this.getOpNumber(0x0fff)
      return
    }
    if (order === 0x2000) {
      this.stackTop += 1
      this.stack[this.stackTop] = this.pCount + 2
      this.pCount = this.getOpNumber(0x0fff)
      return
    }
    if (order === 0x3000) {
      const index = this.getOpNumber(0x0f00) >> 8
      const num = this.getOpNumber(0x00ff)
      this.pCount += (this.v[index] === num ? 4 : 2)
      return
    }
    if (order === 0x4000) {
      const index = this.getOpNumber(0x0f00) >> 8
      const num = this.getOpNumber(0x00ff)
      this.pCount += (this.v[index] !== num ? 4 : 2)
      return
    }
    if (order === 0x5000) {
      this.pCount += (this.v[this.getOpNumber(0x0f00) >> 8] === this.v[this.getOpNumber(0x00f00) >> 4] ? 4 : 2)
      return
    }
    if (order === 0x8000) {
      const lastOrder = this.getOpNumber(0x000f)
      const v1Index = this.getOpNumber(0x0f00) >> 8
      const v2Index = this.getOpNumber(0x00f0) >> 4
      if (lastOrder === 0x0000) {
        this.v[v1Index] = this.v[v2Index]
        this.pCount += 2
        return
      }
      if (lastOrder === 0x0001) {
        this.v[v1Index] = this.v[v1Index] | this.v[v2Index]
        this.pCount += 2
        return
      }
      if (lastOrder === 0x0002) {
        this.v[v1Index] = this.v[v1Index] & this.v[v2Index]
        this.pCount += 2
        return
      }
      if (lastOrder === 0x0003) {
        this.v[v1Index] = this.v[v1Index] ^ this.v[v2Index]
        this.pCount += 2
        return
      }
      if (lastOrder === 0x0004) {
        let res = this.v[v1Index] + this.v[v2Index]
        if (res > 255) {
          this.v[15] = 1
        } else {
          this.v[15] = 0
        }
        this.v[v1Index] = res
        this.pCount += 2
        return
      }
      if (lastOrder === 0x0005) {
        let res = this.v[v1Index] - this.v[v2Index]
        if (res < 0) {
          this.v[15] = 0
        } else {
          this.v[15] = 1
        }
        this.v[v1Index] = res
        this.pCount += 2
        return
      }
      if (lastOrder === 0x0006) {
        
        this.v[15] = this.v[v1Index] & 0x1
        this.v[v1Index] >>= 1
        this.pCount += 2
        return
      }

      
    }
    if (order === 0x9000) {
      this.pCount += (this.v[this.getOpNumber(0x0f00) >> 8] !== this.v[this.getOpNumber(0x00f00) >> 4] ? 4 : 2)
      return
    }
    if (order === 0xa000) {
      this.i = this.getOpNumber(0x0fff)
      this.pCount += 2
      return
    }
    if (order === 0xd000) {
      const x = this.getOpNumber(0x0f00) >> 8
      const y = this.getOpNumber(0x00f0) >> 4
      const height = this.getOpNumber(0x000f)
      this.draw(this.v[x], this.v[y], height)
      this.drawFlag = true
      this.pCount += 2
      return
    }
    if (order === 0xc000) {
      const index = this.getOpNumber(0x0f00) >> 8
      this.v[index] = this.getRandom() & this.getOpNumber(0x00ff)
      this.pCount += 2
      return
    }
    if (order === 0xe000) {
      const lastOrder = this.getOpNumber(0x00ff)
      const index = this.getOpNumber(0x0f00) >> 8
      const keycode= this.v[index]
      if (lastOrder === 0x00a1) {
        this.pCount += (this.keys.indexOf(keycode) === -1 ? 4 : 2)
      }
      if (lastOrder === 0x009e) {
        this.pCount += (this.keys.indexOf(keycode) > -1 ? 4 : 2)
      }
      return
    }
    if (order === 0xf000) {
      const opNum = this.getOpNumber(0x00ff)
      if (opNum === 0x000a) {
        const index = this.v[this.getOpNumber(0x0f00) >> 8]
        const keycode = this.keys[0]
        if (keycode !== undefined) {
          this.v[index] = keycode
          this.pCount += 2
        }
        return
      }
      if (opNum === 0x0018) {
        const num = this.v[this.getOpNumber(0x0f00) >> 8]
        this.soundTimer = num
        this.pCount += 2
        return
      }
      if (opNum === 0x0033) {
        const num = this.v[this.getOpNumber(0x0f00) >> 8]
        this.memory[this.i] = num % 100
        this.memory[this.i + 1] = (num / 10) % 10
        this.memory[this.i + 2] = (num % 100) % 10
        this.pCount += 2
        return
      }
      if (opNum === 0x0055) {
        const num = this.getOpNumber(0x0f00) >> 8
        for (let i = 0; i <= num; i++) {
          this.memory[this.i + i] = this.v[i]
        }
        this.pCount += 2
        return
      }
      if (opNum === 0x0065) {
        for (let i = 0; i <= this.getOpNumber(0x0f00) >> 8; i++) {
          this.v[i] = this.memory[this.i + i]
        }
        this.pCount += 2
        return
      }
      if (opNum === 0x0029) {
        const index = this.getOpNumber(0x0f00) >> 8
        this.i = this.v[index] * 5
        this.pCount += 2
        return
      }
      if (opNum === 0x0015) {
        const index = this.getOpNumber(0x0f00) >> 8
        this.delayTimer = this.v[index]
        this.pCount += 2
        return
      }
      if (opNum === 0x0007) {
        const index = this.getOpNumber(0x0f00) >> 8
        this.v[index] = this.delayTimer
        this.pCount += 2
        return
      }
      if (opNum === 0x001e) {
        const index = this.getOpNumber(0x0f00) >> 8
        this.i += this.v[index]
        this.pCount += 2
        return
      }
    }
    console.log(this)
    throw new Error()
  }

  draw(x, y, h) {
    this.v[15] = 0
    const matrix = []
    for (let i = 0; i < h; i++) {
      const row = this.memory[this.i + i]
      let val = row.toString(2)
      while (val.length !== 8) {
        val = '0' + val
      }
      matrix.push(val)
    }
    matrix.forEach((row, rowIndex) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === '1') {
          if (this.gfx[64 * (y + rowIndex) + x + i] === 1) {
            this.v[15] = 1
          }
          this.gfx[64 * (y + rowIndex) + x + i] ^= 1
        }
      }
    })
  }

  render() {
    if (!this.drawFlag) {
      return
    }
    this.screen.render(this.gfx)
    this.drawFlag = false
  }

  getRandom() {
    return Math.floor(Math.random() * 255)
  }
}