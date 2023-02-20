export default class moraBase {
  constructor (e = {}) {
    this.e = e;
    this.userId = e?.user_id;
    this.model = 'Mora';
  }

  get prefix () {
    return `Mora:${this.model}:`
  }
}