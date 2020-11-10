// require first
const { Module } = require('@dashup/module');

// import base
const PdfPage = require('./pages/pdf');

/**
 * export module
 */
class PdfModule extends Module {

  /**
   * construct discord module
   */
  constructor() {
    // run super
    super();
  }
  
  /**
   * registers dashup structs
   *
   * @param {*} register 
   */
  register(fn) {
    // register sms action
    fn('page', PdfPage);
  }
}

// create new
module.exports = new PdfModule();
