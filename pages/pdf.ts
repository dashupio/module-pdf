
// import page interface
import { Struct } from '@dashup/module';

/**
 * build address helper
 */
export default class PdfPage extends Struct {

  /**
   * returns page type
   */
  get type() {
    // return page type label
    return 'pdf';
  }

  /**
   * returns page type
   */
  get icon() {
    // return page type label
    return 'fa fa-file-pdf';
  }

  /**
   * returns page type
   */
  get title() {
    // return page type label
    return 'PDF Page';
  }

  /**
   * returns page data
   */
  get data() {
    // return page data
    return {};
  }

  /**
   * returns object of views
   */
  get views() {
    // return object of views
    return {
      view   : 'page/board/view',
      config : 'page/board/config',
    };
  }

  /**
   * returns category list for page
   */
  get categories() {
    // return array of categories
    return ['View'];
  }

  /**
   * returns page descripton for list
   */
  get description() {
    // return description string
    return 'PDF view page';
  }
}