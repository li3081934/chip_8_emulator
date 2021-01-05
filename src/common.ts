type ReaderCallback = (buffer: Uint8Array) => void
export class Reader {
  fileInput: HTMLInputElement
  fileReader: FileReader
  callback: ReaderCallback
  then(callback: ReaderCallback) {
    this.callback = callback
  }
  constructor(container: HTMLElement) {
    this.fileInput = document.createElement('input')
    this.fileInput.type = 'file'
    this.fileReader = new FileReader
    this.fileInput.addEventListener('change', () => {
      this.fileReader.readAsArrayBuffer(this.fileInput.files[0]);
    })
    this.fileReader.addEventListener('loadend', () => {
      if (this.fileReader.result instanceof ArrayBuffer) {
        this.callback(new Uint8Array(this.fileReader.result))
      }
    })
    container.appendChild(this.fileInput)
  }
}