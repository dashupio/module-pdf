
// import page interface
import fs from 'fs-extra';
import dotProp from 'dot-prop';
import request from 'request';
import { Struct } from '@dashup/module';
import { Storage } from '@google-cloud/storage';
import { fromPath } from 'pdf2pic';
import { PDFImage } from 'pdf-image';
import { v4 as uuid } from 'uuid';

/**
 * build address helper
 */
export default class PdfPage extends Struct {

  /**
   * construct
   */
  constructor(...args) {
    // return
    super(...args);

    // run listen
    this.saveAction = this.saveAction.bind(this);
  }

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
    return 'fad fa-file-pdf text-info';
  }

  /**
   * returns page type
   */
  get title() {
    // return page type label
    return 'PDF';
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
      view   : 'page/pdf',
      config : 'page/pdf/config',
      render : 'page/pdf/render',
    };
  }

  /**
   * returns object of views
   */
  get actions() {
    // return object of views
    return {
      save : this.saveAction,
    };
  }

  /**
   * returns category list for page
   */
  get categories() {
    // return array of categories
    return ['Misc'];
  }

  /**
   * returns page descripton for list
   */
  get description() {
    // return description string
    return 'Upload and edit PDF files';
  }

  /**
   * save acton
   *
   * @param opts 
   * @param page 
   */
  async saveAction(opts, page) {
    // check page
    if (dotProp.get(page, 'data.pdf.url') && dotProp.get(page, 'data.pdf.url').includes('.pdf') && dotProp.get(page, 'data.image.pdf') !== dotProp.get(page, 'data.pdf.id')) {
      // temp
      const temp = uuid();

      // await download
      const file = await this.__download(dotProp.get(page, 'data.pdf.url'), temp);

      // create images
      const fn = fromPath(file, {
        width    : 595,
        height   : 842,
        format   : 'png',
        density  : 800,
        quality  : 100,
        savePath : `${this.dashup.cache}/pdfs`,
      });

      // images
      const images = await fn.bulk(-1);

      // remove file
      await fs.remove(file);

      // upload images
      await this.__storage();

      // upload
      await Promise.all(images.map((image, i) => {
        // Create upload
        return this.store
          .bucket(this.dashup.config.bucket)
          .upload(image.path, {
            gzip        : true,
            destination : `pdf/${page._id}/${temp}.${i}.png`,
          });
      }));

      // rmeove all images
      await Promise.all(images.map((image) => {
        // remove image
        return fs.remove(image.path);
      }));
      
      // set
      page.data.image = {
        pdf    : dotProp.get(page, 'data.pdf.id'),
        images : images.map((img, i) => `https://${this.dashup.config.bucket}/pdf/${page._id}/${temp}.${i}.png`),
      };
    }    

    // return page
    return {
      page,
    };
  }

  /**
   * download to temp url
   *
   * @param url 
   * @param tmp 
   */
  async __download(url, tmp) {
    // get cache url
    const dir = `${this.dashup.cache}/pdfs`;
    const pdf = `${dir}/${tmp}`;

    // ensure dir
    await fs.ensureDir(dir);

    // Create request
    const res  = request.get(url);
    const dest = fs.createWriteStream(`${pdf}.pdf`);

    // Res pipe dest
    res.pipe(dest);

    // Run Promise
    await new Promise((resolve) => {
      // Resolve on end
      res.on('end', resolve);
    });

    // return dir
    return `${pdf}.pdf`;
  }

  /**
   * storage
   */
  async __storage() {
    // Create store
    this.store = this.store || new Storage({
      credentials : this.dashup.config.google,
    });

    // Get bucket
    this.bucket = this.bucket || new Promise(async (res) => {
      try {
        // Run try/catch
        await this.store.createBucket(this.dashup.config.bucket);
      } catch (e) { /* eh */ }

      // Resolve
      res();
    });

    // return bucket
    return this.bucket;
  }
}