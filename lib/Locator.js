class Locator {
  /**
   * Creates an Locator
   * @param  {string} protocol http or https
   * @param  {string} host     Hostname
   * @param  {number} port     Leave blank if standard (80 or 443)
   */
  constructor ({protocol, host, port}) {
    this.protocol = protocol;
    this.host = host;
    if (port) {
      this.port = port;
    }
  }
}

module.exports = Locator;
