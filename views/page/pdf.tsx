
import Measure from 'react-measure';
import shortid from 'shortid';
import SimpleBar from 'simplebar-react';
import { Resizable } from 'react-resizable';
import { ReactSortable } from 'react-sortablejs';
import { Page, Hbs, View } from '@dashup/ui';
import { Modal, Button, Offcanvas } from 'react-bootstrap';
import { Document, Page as DocumentPage, pdfjs } from 'react-pdf';
import React, { useState, useEffect } from 'react';

// scss
import './pdf.scss';

// set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// offset
const origOffset = {
  x : 0,
  y : 0,
};

// calendar page
const PagePdf = (props = {}) => {
  // state
  const [menu, setMenu] = useState(false);
  const [pages, setPages] = useState([]);
  const [width, setWidth] = useState(300);
  const [update, setUpdate] = useState(null);
  const [remove, setRemove] = useState(null);
  const [config, setConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // migrate fields
  if (props.page.get('data.fields') && !Array.isArray(props.page.get('data.fields'))) {
    // set fields
    props.page.set('data.fields', Object.keys(props.page.get('data.fields')).reduce((accum, key) => {
      // value
      accum.push(...(props.page.get(`data.fields.${key}`) || []).map((field) => {
        // set page
        field.page = key;

        // return field
        return field;
      }));

      // return accum
      return accum;
    }, []));
  }
  
  // fields
  const [fields, setFields] = useState(props.page.get('data.fields') || []);

  // render field
  const renderField = (column) => {
    // find field
    const field = props.getField(column.field);

    // check if custom
    if (column.field === 'custom') return (
      <div className="grid-column-content">
        <Hbs template={ column.view || '' } data={ props.item ? props.item.toJSON() : {} } />
      </div>
    );

    // return no field
    return field && (
      <View
        view="view"
        type="field"
        item={ props.item }
        field={ field }
        value={ props.item ? props.item.get(field.name || field.value) : null }
        struct={ field.type }
        dashup={ props.dashup }
        column={ column }
        >
        <div className="text-center">
          <i className="fa fa-spinner fa-spin" />
        </div>
      </View>
    );
  };

  // set field
  const setField = (field, key, value = null, prev = false) => {
    // actual field
    const actualField = (fields || []).find((f) => f.id === (typeof field === 'string' ? field : field.id));

    // set update
    let updates = {
      [key] : value,
    };

    // check type
    if (typeof key === 'object') {
      updates = key;
      prev = value;
    }

    // set key
    Object.keys(updates).forEach((k) => {
      // set
      actualField[k] = updates[k];
    });

    // check prev
    if (prev) {
      // update
      setFields([...fields]);
    } else {
      // update
      props.setData('fields', [...(fields || [])]);
      setFields([...fields]);
    }
  };

  // get fields
  const getFields = (page) => {
    // set page
    return (fields || []).filter((f) => `${f.page}` === `${page}`);
  };

  // to percent
  const toPercent = (a, b) => {
    return parseFloat(((a / b) * 100).toFixed(2));
  };

  // get height
  const getHeight = () => {
    // drop page
    const dropPage = document.querySelector('.pdf');

    // get actual placement
    const placement = dropPage.getBoundingClientRect();

    // return height
    return placement.height;
  };

  // on resize
  const onResize = (field, event, { size }) => {
    // set field
    setField(field, {
      widthP  : size.width,
      heightP : size.height,
    }, true);
  };

  // on resized
  const onResized = () => {
    // loop fields
    fields.forEach((field) => {
      // check field
      if (field.widthP || field.heightP) {
        // drop page
        const dropPage = document.querySelector('.pdf');
    
        // get actual placement
        const placement = dropPage.getBoundingClientRect();
    
        // height
        const width = toPercent(field.widthP, placement.width);
        const height = toPercent(field.heightP, placement.height);
        
        // delete unwanted
        delete field.widthP;
        delete field.heightP;

        // set
        setField(field, {
          width,
          height,
        });
      }
    });
  };

  // on drag
  const onDrag = (event) => {
    // expand
    const { x, y } = event.originalEvent;

    // rect
    const cloneRect = event.item.getBoundingClientRect();

    // set offset
    origOffset.x = cloneRect.x - x;
    origOffset.y = cloneRect.y - y;
  };

  // op drop
  const onDrop = async (event) => {
    // expand
    const { x, y } = event.originalEvent;

    // get type
    const id   = event.item.getAttribute('id');
    const type = event.item.getAttribute('data-type');

    // rect
    const cloneRect = event.item.getBoundingClientRect();

    // set x/y
    cloneRect.x = x;
    cloneRect.y = y;

    // loop pages
    const dropPage = [...document.querySelectorAll('.pdf')].find((pageElement) => {
      // get rect
      const pageRect = pageElement.getBoundingClientRect();

      // check in page
      if (cloneRect.y < pageRect.y && cloneRect.x < pageRect.x) return;
    
      // check height
      if ((cloneRect.y + cloneRect.height) > (pageRect.y + pageRect.height)) return;
    
      // check height
      if ((cloneRect.x + cloneRect.width) > (pageRect.x + pageRect.width)) return;

      // return true
      return true;
    }) || document.querySelector('.pdf');

    // page id
    const pageId = dropPage.getAttribute('data-page');

    // get actual placement
    const placement = dropPage.getBoundingClientRect();

    // add to page
    const fields = props.page.get('data.fields') || [];

    // top/left
    const top = toPercent(cloneRect.y - placement.y + origOffset.y, placement.height);
    const left = toPercent(cloneRect.x - placement.x + origOffset.x, placement.width);
    const width = toPercent(cloneRect.width, placement.width);
    const height = toPercent(cloneRect.height, placement.height);

    // check id
    if (id) {
      // moving existing item
      return setField(id, {
        top,
        left,
        width,
        height,
      });
    } else {
      // moving new item
      fields.push({
        id    : shortid(),
        page  : pageId,
        title : type === 'custom' ? 'Custom' : null,
        field : type,
  
        top,
        left,
        width,
        height,
      });
    }

    // set to data
    await props.setData('fields', [...fields]);
    setFields([...fields]);
  };

  // on remove
  const onRemove = (field) => {
    // new fields
    const newFields = (props.page.get('data.fields') || []).filter((f) => f.id !== field.id);

    // update
    props.setData('fields', [...newFields]);
    setFields([...newFields]);
    setRemove(null);
  };
  
  // remove jsx
  const updateJsx = update && (
    <Modal show onHide={ (e) => setUpdate(null) }>
      <Modal.Header closeButton>
        <Modal.Title>
          Updating <b>{ update.label || update.uuid }</b>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <View
          type="field"
          view="code"
          mode="handlebars"
          struct="code"
          value={ update.view }
          dashup={ props.dashup }
          onChange={ (val) => setField(update, 'view', val) }
          />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={ (e) => !setUpdate(null) && e.preventDefault() }>
          Close
        </Button>
        <Button variant="success" className="ms-2" onClick={ (e) => !setUpdate(null) && e.preventDefault() }>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  // remove jsx
  const removeJsx = remove && (
    <Modal show onHide={ (e) => setRemove(null) }>
      <Modal.Header closeButton>
        <Modal.Title>
          Removing <b>{ remove.label || remove.uuid }</b>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="lead">
          Are you sure you want to remove <b>{ remove.label || 'this Field' }</b>?
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={ (e) => !setRemove(null) && e.preventDefault() }>
          Close
        </Button>
        <Button variant="danger" className="ms-2" onClick={ (e) => onRemove(remove) }>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // return jsx
  return (
    <Page { ...props } loading={ loading } bodyClass="flex-column">

      <Page.Config show={ config } onHide={ (e) => setConfig(false) } />

      <Page.Menu onConfig={ () => setConfig(true) } presence={ props.presence } onShare>
        { !updating && !!props.item && (
          <a className="me-2 btn btn-primary" href={ `/app/${props.page.get('_id')}/${props.item.get('_id')}/render` } target="_blank">
            <i className="fa fa-file-pdf me-2" /> View PDF
          </a>
        ) }
        
        { updating && props.dashup.can(props.page, 'manage') && (
          <button className="me-2 btn btn-primary" onClick={ () => setMenu(true) }>
            <i className="fa fa-plus me-2" />
            Add Field
          </button>
        ) }
        { props.dashup.can(props.page, 'manage') && (
          <button className={ `me-2 btn btn-${!updating ? 'link text-dark' : 'primary'}` } onClick={ (e) => setUpdating(!updating) }>
            <i className={ `fat fa-${!updating ? 'pencil' : 'check'} me-2` } />
            { !updating ? 'Update PDF' : 'Finish Updating' }
          </button>
        ) }
      </Page.Menu>
      <Page.Body>
        <div className="flex-1 fit-content">
          <div className="h-100 w-100">
            <SimpleBar className="h-100 p-relative">
              <div className="container-lg">
                <Measure bounds onResize={ ({ bounds }) => setWidth(parseInt(bounds.width, 10)) }>
                  { ({ measureRef }) => {
                    // return jsx
                    return (
                      <div ref={ measureRef }>
                        { !!props.page.get('data.pdf.url') && (
                          <Document
                            file={ props.page.get('data.pdf.url').replace('storage.googleapis.com/', '') }
                            className="w-100"
                            onLoadSuccess={ ({ numPages }) => {
                              // create pages
                              const actualPages = [];
                
                              // push
                              for (let i = 1; i <= numPages; i++) {
                                actualPages.push(i);
                              }
                
                              // set pages
                              setPages(actualPages);
                            } }
                          >
                            { pages.map((page, i) => {
                              // return jsx
                              return (
                                <div className="mb-3 rounded pdf" key={ `page-${page}` } data-page={ i }>
                                  <DocumentPage className="rounded" width={ width } pageNumber={ page } />
                                  <ReactSortable
                                    list={ getFields(i) }
                                    group={ props.page.get('_id') }
                                    onEnd={ onDrop }
                                    handle=".move"
                                    onStart={ onDrag }
                                    setList={ () => {} }
                                    forceFallback
                                  >
                                    { getFields(i).map((field, a) => {
                                      // create child
                                      return (
                                        <div key={ `field-${field.id}` } className="pdf-field rounded" id={ field.id } data-page={ i } data-x={ field.left } data-y={ field.top } style={ {
                                          top    : `${field.top}%`,
                                          left   : `${field.left}%`,
                                          width  : field.widthP ? `${field.widthP}px` : `${field.width}%`,
                                          height : field.heightP ? `${field.heightP}px` : `${field.height}%`,
                                        } }>
                                          { updating && (
                                            <div className="floating">
                                              <div className="btn-group"> 
                                                <button className="btn btn-sm btn-primary move">
                                                  <i className="fa fa-arrows" />
                                                </button>
                                                { field.field === 'custom' && (
                                                  <button className="btn btn-sm btn-primary" onClick={ (e) => setUpdate(field) }>
                                                    <i className="fa fa-ellipsis-h" />
                                                  </button>
                                                ) }
                                                <button className="btn btn-sm btn-danger" onClick={ (e) => setRemove(field) }>
                                                  <i className="fa fa-trash" />
                                                </button>
                                              </div>
                                            </div>
                                          ) }
                                          { updating ? (
                                            <Resizable
                                              width={ field.widthP || ((parseInt(field.width) / 100) * width) }
                                              height={ field.heightP || ((parseInt(field.height) / 100) * getHeight()) }
                                              onResize={ (...args) => onResize(field, ...args) }
                                              onResizeStop={ onResized }
                                              >
                                              <div className="pdf-field-inner">
                                                { renderField(field) }
                                              </div>
                                            </Resizable>
                                          ) : (
                                            <div className="pdf-field-inner">
                                              { renderField(field) }
                                            </div>
                                          ) }
                                        </div>
                                      );
                                    }) }
                                  </ReactSortable>
                                </div>
                              );
                            }) }
                          </Document>
                        ) }
                      </div>
                    );
                  } }
                </Measure>
              </div>
            </SimpleBar>
          </div>
        </div>
      </Page.Body>

      { removeJsx }
      { updateJsx }

      <Offcanvas backdrop={ false } show={ menu } onHide={ () => setMenu(null) }>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            PDF Fields
          </Offcanvas.Title>
        </Offcanvas.Header>
        <div className="w-100 h-100 d-flex flex-column">
          <div className="p-3 lead">
            Drag one of these fields into the pdf where you need it.
          </div>
          <div className="flex-1 fit-content">
            <SimpleBar className="p-3">
              <ReactSortable
                clone
                list={ props.getFields() }
                group={ props.page.get('_id') }
                onEnd={ onDrop }
                onStart={ onDrag }
                setList={ () => {} }
              >
                <>
                  <div className="card border border-secondary mb-2" data-type="custom">
                    <div className="card-body">
                      <i className="fa fa-function me-2" />
                      Custom
                    </div>
                  </div>
                  <hr />
                  { (props.getFields() || []).map((field, i) => {
                    // get struct
                    const fieldStruct = props.getFieldStruct(field.type);

                    // return fields
                    return (
                      <div key={ `field-${field.uuid}` } className="card border border-secondary mb-2" data-type={ field.type }>
                        <div className="card-body">
                          <div className="d-flex w-100 justify-content-between">
                            <h5 className="mb-1">
                              { field.label }
                            </h5>
                          </div>
                          <p className="m-0">{ fieldStruct?.description }</p>
                        </div>
                      </div>
                    );
                  }) }
                </>
              </ReactSortable>
            </SimpleBar>
          </div>
        </div>
      </Offcanvas>
    </Page>
  );
};

// export default
export default PagePdf;