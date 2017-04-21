import chai from 'chai';
const expect = chai.expect;
import Vue from 'vue';
import FormlyField from 'src/components/FormlyField.vue';
import Utils from 'src/util';

let el, vm;

function createForm(template, data){
  el = document.createElement('DIV');
  document.body.appendChild(el);
  //el.innerHTML = template;
  vm = new Vue({
    data: data,
    template: template,
    components: {
      'formly-field': FormlyField
    }
  }).$mount(el);

  return [el, vm];
}


describe('FormlyField', () => {

  it('should take on the type of another component', () => {

    Vue.component('formly_test', {
      props: ['form', 'model', 'field'],
      template: '<div id="testComponent">{{field.type}}</div>'
    });

    let data = {
      form:{
        $errors: {},
        $valid: {},
      },
      fields: [
        {
          key: 'test',
          type: 'test' 
        }
      ],
      model: {
        test: ''
      }
    };
    
    createForm('<formly-field :form="form" :model="model" :field="fields[0]"></formly-field>', data);

    expect(vm.$el.textContent).to.equal(data.fields[0].type);
    
  });

  
  it('should mimic the model of the parent', (done) => {

    Vue.component('formly_test', {
      props: ['form', 'field', 'model'],
      template: '<input type="text" id="testInput" v-model="model[ field.key ]">'
    });

    let data = {
      form: {
        $errors: {},
        $valid: {}
      },
      fields: [
        {
          key: 'search',
          type: 'test' 
        }
      ],
      model: {
        search: 'foo'
      }
    };

    createForm('<formly-field :form.sync="form" :field="fields[0]" :model="model"></formly-field>', data);

    expect(vm.$el.value).to.equal('foo');

    //change the value and expect a change
    vm.model.search = 'bar';

    setTimeout(() => {
      expect(vm.$el.value).to.equal('bar');
      done();
    }, 0);
    
  });

  it('Should pass template options', () => {

    Vue.component('formly_test', {
      props: ['form', 'field', 'model', 'to'],
      template: '<div>{{to}}</div>'
    });

    let data = {
      form: {
        $errors: {},
        $valid: {}
      },
      fields: [
        {
          key: 'search',
          type: 'test',
          templateOptions: {
            foo: 'bar',
            something: 'else'
          }
        }
      ],
      model: {
        search: ''
      }
    };

    createForm('<formly-field :form.sync="form" :field="fields[0]" :model="model"></formly-field>', data);

    expect(JSON.parse(vm.$el.textContent)).to.deep.equal(data.fields[0].templateOptions);
    
  });

  it('Should take a wrapper string', () => {
    Vue.component('formly_test', {
      props: ['form', 'field', 'model', 'to'],
      template: '<div></div>'
    });
    
    let data = {
      form: {
        $errors: {},
        $valid: {}
      },
      fields: [
        {
          key: 'wrapped',
          type: 'test',
          wrapper: '<div id="test_wrapper_element"></div>'
        }
      ],
      model: {
        wrapped: ''
      }
    };
    createForm('<formly-field :form.sync="form" :field="fields[0]" :model="model"></formly-field>', data);

    let parent = vm.$el.parentNode;
    expect(parent.firstChild).to.equal(vm.$el);
    expect(parent.id).to.equal('test_wrapper_element');    
  });

  
  describe('Validation', ()=>{

    before(()=>{
      Vue.component('formly_test', {
        props: ['form', 'field', 'model'],
        template: '<div></div>'
      });
    });

    function createValidField(data){
      return createForm('<formly-field :form.sync="form" :field="fields[0]" :model="model"></formly-field>', data);
    };

    it('should handle required values', (done) => {

      let data = {
        form: {
          $valid: true,
          $errors: {}
        },
        model: {
          search: ''
        },
        fields: [
          {
            key: 'search',
            type: 'test',
            required: true
          }
        ]
      };
      
      createValidField(data);
      expect(vm.form.$errors.search.required).to.be.true;
      vm.model.search = 'testing';
      setTimeout(()=>{
        expect(vm.form.$errors.search.required).to.be.false;
        done();
      },0);
      
    });

    it('should take an expression', (done) => {
      let data = {
        form: {
          $valid: true,
          $errors: {}
        },
        model: {
          search: 'testing'
        },
        fields: [
          {
            key: 'search',
            type: 'test',
            validators: {
              expression: 'model.search == "test"'
            }
          }
        ]
      };

      createValidField(data);
      expect(vm.form.$errors.search.expression).to.be.true;
      vm.model.search = 'test';
      setTimeout(()=>{
        expect(vm.form.$errors.search.expression).to.be.false;
        done();
      },0);
    });

    it('should not require non-required values', (done) => {
      let data = {
        form: {
          $valid: true,
          $errors: {}
        },
        model: {
          search: ''
        },
        fields: [
          {
            key: 'search',
            type: 'test',
            validators: {
              expression: 'field.value == "test"'
            }
          }
        ]
      };

      createValidField(data);
      expect(vm.form.$errors.search.expression).to.be.false;

      vm.model.search = 'testing';
      setTimeout(()=>{
        expect(vm.form.$errors.search.expression).to.be.true;
        done();
      },0);
    });  

    it('should take a function', (done) => {
      let data = {
        form: {
          $valid: true,
          $errors: {}
        },
        model: {
          search: 'testing'
        },
        fields: [
          {
            key: 'search',
            type: 'test',
            validators: {
              expression: function(field, model, next){
                let valid = model.search == 'test';
                next( valid );
                //return model.search == 'test';
              }
            }
          }
        ]
      };

      createValidField(data);
      expect(vm.form.$errors.search.expression).to.be.true;
      vm.model.search = 'test';
      setTimeout(()=>{
        expect(vm.form.$errors.search.expression).to.be.false;
        done();
      },0);
    });

    it('Async Validation', (done) => {
      let data = {
        form: {
          $valid: true,
          $errors: {}
        },
        model: {
          search: 'testing'
        },
        fields: [
          {
            key: 'search',
            type: 'test',
            validators: {
              asyncExpression: function(field, model, next){
                console.log('--- first timeout here');
                let valid = model.search == 'test';
                setTimeout( function(){
                  console.log('--------------- timeout here');
                  next( valid );
                }, 500);
              }
            }
          }
        ]
      };

      createValidField(data);
      console.log('expression is ', vm.form.$errors.search.asyncExpression);
      expect(vm.form.$errors.search.asyncExpression).to.be.true;
      vm.model.search = 'test';
      setTimeout(()=>{
        //expect(vm.form.$errors.search.expression).to.be.false;
        //done();
      },1000);
    });

    describe("Validation Messages", (done) => {

      //what do we want to do

      //--- define messages ---
      //vf.addValidationString('validatorKey', 'message');

      //add specific messages
      /*
       * validators: {
       *    test: {
       *      expression: function(){},
       *      message: '%l requires 10, you entered %s'
       *    }
       * }
       */

      it('Inline messages', () => {
        let data = {
          form: {
            $valid: true,
            $errors: {}
          },
          model: {
            search: 'testing'
          },
          fields: [
            {
              key: 'search',
              type: 'test',
              validators: {
                validatorMessage:
                {
                  expression: 'model.search == "test"',
                  message: 'Must equal test'
                }
              }
            }
          ]
        };

        createValidField(data);
        expect(vm.form.$errors.search.validatorMessage).to.equal('Must equal test');
      });

      it('Inline messages with a function', () => {
        let data = {
          form: {
            $valid: true,
            $errors: {}
          },
          model: {
            search: 'testing'
          },
          fields: [
            {
              key: 'search',
              type: 'test',
              validators: {
                validatorMessage:
                {
                  expression: function(field, model, next){
                    let valid = model.search == "test";
                    next(valid);
                  },
                  message: 'Must equal test'
                }
              }
            }
          ]
        };

        createValidField(data);
        expect(vm.form.$errors.search.validatorMessage).to.equal('Must equal test');
      });

      it('Inline messages with values parsed', () => {
        let data = {
          form: {
            $valid: true,
            $errors: {}
          },
          model: {
            search: 'testing'
          },
          fields: [
            {
              key: 'search',
              type: 'test',
              templateOptions: {
                label: 'test'
              },
              validators: {
                validatorMessage:
                {
                  expression: 'model.search == "test"',
                  message: '%l and %v'
                }
              }
            }
          ]
        };

        createValidField(data);
        expect(vm.form.$errors.search.validatorMessage).to.equal('test and testing');
      });

      it('Global messages with values parsed', () => {
        let data = {
          form: {
            $valid: true,
            $errors: {}
          },
          model: {
            search: 'testing'
          },
          fields: [
            {
              key: 'search',
              type: 'test',
              templateOptions: {
                label: 'test'
              },
              validators: {
                validatorMessage: 'model.search == "test"',
              }
            }
          ]
        };

        //just mock the other vue functions
        Utils.validationMessages.validatorMessage = '%l and %v';
        
        createValidField(data);
        expect(vm.form.$errors.search.validatorMessage).to.equal('test and testing');
      });
      
    });
    
  });
   
});

