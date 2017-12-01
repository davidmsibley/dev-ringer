class Rule {
  /**
   * Creates a Rule
   * @param  {Function} handler (req, res) return true to continue the chain.
   * @param  {string} path Optional
   * @return {[type]}         [description]
   */
  constructor ({handler, path}) {
    this.handler = handler;
    this.path = path;
  }
}

module.exports = Rule;
