
// import react
import React from 'react';
import shortid from 'shortid';
import { View, Select } from '@dashup/ui';

// create page model config
const PagePdfConfig = (props = {}) => {

  // get dashboards
  const getModels = () => {
    // get forms
    const models = Array.from(props.dashup.get('pages').values()).filter((page) => {
      // return model pages
      return page.get('type') === 'model';
    });

    // return mapped
    return models.map((model) => {
      // return values
      return {
        value : model.get('_id'),
        label : model.get('name'),

        selected : (props.page.get('data.model') || []).includes(model.get('_id')),
      };
    });
  };

  // get forms
  const getForms = () => {
    // get forms
    const forms = Array.from(props.dashup.get('pages').values()).filter((page) => {
      // return model pages
      return page.get('type') === 'form' && page.get('data.model') === props.page.get('data.model');
    });

    // return mapped
    return forms.map((form) => {
      // return values
      return {
        value : form.get('_id'),
        label : form.get('name'),

        selected : (props.page.get('data.forms') || []).includes(form.get('_id')),
      };
    });
  };

  // on forms
  const onModel = (value) => {
    // set data
    props.setData('model', value?.value);
  };


  // on forms
  const onForms = (value) => {
    // set data
    props.setData('forms', value.map((v) => v.value));
  };

  // on change
  const onChange = (val) => {
    // set model
    props.setData('pdf', val && val[0]);
  };

  // return jsx
  return (
    <>
      <div className="mb-3">
        <label className="form-label">
          Choose Model
        </label>
        <Select options={ getModels() } defaultValue={ getModels().filter((f) => f.selected) } onChange={ onModel } isClearable />
        <small>
          View PDFs with this models items.
        </small>
      </div>

      { !!props.page.get('data.model') && (
        <div className="mb-3">
          <label className="form-label">
            Model Form(s)
          </label>
          <Select options={ getForms() } defaultValue={ getForms().filter((f) => f.selected) } onChange={ onForms } isMulti />
          <small>
            The forms that this pdf will use.
          </small>
        </div>
      ) }

      <div className="mb-3">
        <View
          type="field"
          view="input"
          struct="file"

          field={ {
            uuid : shortid(),
            label : 'PDF File',
          } }
          value={ props.page.get('data.pdf') }
          dashup={ props.dashup }
          onChange={ (field, value) => onChange(value) }
        />
      </div>

      { !!props.page.get('data.image.images') && (
        <div className="row">
          { props.page.get('data.image.images').map((image, i) => {
            // return jsx
            return (
              <div key={ `image-${i}` } className="col-4">
                <img src={ image } className="img-fluid rounded border border-secondary" />
              </div>
            );
          }) }
        </div>
      ) }
    </>
  )
};

// export default
export default PagePdfConfig;