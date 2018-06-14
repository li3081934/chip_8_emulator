function In_0x6000(opcodes,V) {
    let vIndex= (opcodes&0x0F00)>>8
    let value=opcodes&0x00FF
    V[vIndex]=value
}

function In_0x7000(opcodes,V) {
    let vIndex= (opcodes&0x0F00)>>8
    let value=opcodes&0x00FF
    V[vIndex]+=value
}

function In_0x8000(opcodes,V) {
    //console.log(opcodes.toString(16))
    let Vx=(opcodes&0x0F00)>>8
    let Vy=(opcodes&0x00F0)>>4
    switch (opcodes&0x000F){

        case 0x0:
            V[Vx]=V[Vy];
            break;
        case 0x1:
            V[Vx]=V[Vx]|V[Vy];
            break;
        case 0x2:
            V[Vx]=V[Vx]&V[Vy];
            break;
        case 0x3:
            V[Vx]=V[Vx]^V[Vy];
            break;
        case 0x4:           //加减有借位
            V[Vx]+=V[Vy];
            break;
        case 0x5:
            V[Vx]-=V[Vy];
            break;
        case 0x7:
            V[Vx]=V[Vy]-V[Vx];
            break;
        case 0x6:           //平移要把低位和高位复制的寄存器的flag位置
            let lsb=V[Vy]&0x01;
            V[15]=lsb;
            console.log(V[Vy]);
            V[Vx]=V[Vy]>>1;
            break;
        case 0xE:           //平移要把低位和高位复制的寄存器的flag位置
            let msb=V[Vy]&0x80;
            V[15]=msb;
            console.log(V[Vy]);
            V[Vx]=V[Vy]<<1;
            break;
    }
}
