
import Measure from 'react-measure';
import { Hbs, View } from '@dashup/ui';
import { Document, Page as DocumentPage, pdfjs } from 'react-pdf';
import React, { useState, } from 'react';

// scss
import '../pdf.scss';

// set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


// calendar page
const PagePdfRender = (props = {}) => {
  // state
  const [pages, setPages] = useState([]);
  const [width, setWidth] = useState(300);

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

  // get fields
  const getFields = (page) => {
    // set page
    return (fields || []).filter((f) => `${f.page}` === `${page}`);
  };

  // return jsx
  return (
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
                      { getFields(i).map((field, a) => {
                        // create child
                        return (
                          <div key={ `field-${field.id}` } className="pdf-field bg-transparent" id={ field.id } data-page={ i } data-x={ field.left } data-y={ field.top } style={ {
                            top    : `${field.top}%`,
                            left   : `${field.left}%`,
                            width  : field.widthP ? `${field.widthP}px` : `${field.width}%`,
                            height : field.heightP ? `${field.heightP}px` : `${field.height}%`,
                          } }>
                            <div className="pdf-field-inner bg-transparent">
                              { renderField(field) }
                            </div>
                          </div>
                        );
                      }) }
                    </div>
                  );
                }) }
              </Document>
            ) }
          </div>
        );
      } }
    </Measure>
  );
};

// export default
export default PagePdfRender;