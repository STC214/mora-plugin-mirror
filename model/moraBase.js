export default class moraBase {
  constructor (e = {}) {
    this.e = e;
    this.userId = e?.user_id;
    this.model = 'mora';
  }

  get prefix () {
    return `Yz:mora:${this.model}:`
  }
}