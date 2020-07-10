import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import classes from './Login.module.scss';
import axios from 'axios';

import * as actions from '../../store/actions/index';
import Button from '../../components/UI/Button/Button';
import ComponentFactory from '../../components/UI/InputComponents/ComponentFactory';
import InputContext from '../../context/InputContext';
import withErrorHandler from '../../hoc/withErrorHandler/withErrorHandler';
import Spinner from '../../components/UI/Loaders/Spinner';
import DefaultPageLayout from '../../hoc/DefaultPageLayout/DefaultPageLayout';
import { CheckValidity as validationCheck } from '../../shared/validation';
import Card from '../../components/UI/Card/Card';

class Auth extends Component {
  constructor(props) {
    super(props);
    this.submitInputRef = React.createRef();
    this.submitButtonRef = React.createRef();
  }
  state = {
    form: {
      email: {
        component: 'input',
        field: 'email',
        label: 'Email',
        componentconfig: {
          type: 'text',
          placeholder: 'Mail Address',
        },
        value: {
          data: '',
          valid: false,
          touched: false,
          pristine: true,
          errors: null,
        },
      },
      password: {
        component: 'inputwithicon',
        field: 'password',
        label: 'Password',
        componentconfig: {
          type: 'password',
          placeholder: 'Password',
          iconposition: 'right',
          iconstyle: 'fas',
          iconcode: 'eye',
          iconsize: 'sm',
          hasdivider: 'true',
          iconclick: () => this.togglePasswordVisibility,
        },

        value: {
          data: '',
          valid: false,
          touched: false,
          pristine: true,
          errors: null,
        },
      },
    },
    formIsValid: false,
    isSignUp: false,
    isPasswordVisible: false,
  };
  //------------------------------------------------------
  //------------------------------------------------------
  componentDidMount() {
    //check we reset path if not busy before authenticate
    // if (
    //   /*!this.props.buildingBurger && */ this.props.authRedirectPath !== '/'
    // ) {
    //   this.props.onSetAuthRedirectPath(); //always passes /
    // }
    window.addEventListener('keydown', this.keyListener);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.keyListener);
  }

  keyListener = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13 || event.which === 13) {
      console.log('key: ', event.key);
      this.onSubmitHandler(event);
    }
  };

  togglePasswordVisibility = () => {
    console.log('togglePassword!!!!');
    this.setState((prevState) => {
      let obj = { ...this.state.form.password.componentconfig };
      if (prevState.form.password.componentconfig.type === 'password') {
        obj.type = 'text';
        obj.iconcode = 'eye-slash';
      } else {
        obj.type = 'password';
        obj.iconcode = 'eye';
      }

      return {
        isPasswordVisible: !prevState.isPasswordVisible,
        form: {
          ...prevState.form,
          password: { ...prevState.form.password, componentconfig: obj },
        },
      };
    });
  };
  //------------------------------------------------------
  //------------------------------------------------------
  //checks the .valid property of each input in array or individual input
  //returns true/false if form object is valid/invalid
  checkInputValidProperty = (form) => {
    // console.log('IS FORM VALID CHECK');
    let formIsValid = true;

    //each prop in contact
    for (let inputIdentifier in form) {
      //if the prop of contact has an element type of...
      if (form[inputIdentifier].componentconfig.valuetype === 'array') {
        for (let each of form[inputIdentifier].value) {
          formIsValid = each.valid && formIsValid;
        }
      } else {
        formIsValid = form[inputIdentifier].value.valid && formIsValid;
      }
    }

    return formIsValid;
  };

  //------------------------------------------------------
  //------------------------------------------------------
  inputChangedHandler = (newval, inputIdentifier, index = null) => {
    // console.log('inputChangedHandler: ', inputIdentifier);
    //single contact
    const updatedForm = {
      ...this.state.form,
    };

    //single prop of form
    const updatedFormElement = {
      ...updatedForm[inputIdentifier],
    };

    let validation = validationCheck(newval, updatedFormElement.validation);
    //if array
    if (index !== null) {
      updatedFormElement.value[index].data = newval;
      updatedFormElement.value[index].touched = true;
      updatedFormElement.value[index].pristine = false;
      updatedFormElement.value[index].valid = validation.isValid;
      updatedFormElement.value[index].errors = validation.errors;
    } else {
      //if single value
      updatedFormElement.value.data = newval;
      updatedFormElement.value.touched = true;
      updatedFormElement.value.pristine = false;
      updatedFormElement.value.valid = validation.isValid;
      updatedFormElement.value.errors = validation.errors;
    }

    updatedForm[inputIdentifier] = updatedFormElement; //update form's input element state as that or 'updatedFormElement'

    const formValidCheck = this.checkInputValidProperty(updatedForm);
    // console.log('FORM VALIDITY: ', formValidCheck);
    this.setState({ form: updatedForm, formIsValid: formValidCheck });
  };

  onSubmitHandler = (event) => {
    event.preventDefault(); //prevents reloading of page
    this.props.onAuth(
      this.state.form.email.value.data,
      this.state.form.password.value.data,
      this.state.isSignUp
    );
  };

  switchAuthModeHandler = (event) => {
    event.preventDefault();
    console.log('switchAuthModeHandler!');

    let email = { ...this.state.form.email.value };
    email.data = '';

    this.setState((prevState) => {
      return {
        isSignUp: !prevState.isSignUp,
        form: {
          ...prevState.form,
          email: {
            ...prevState.form.email,
            value: { ...prevState.form.email.value, data: '' },
          },
          password: {
            ...prevState.form.password,
            value: { ...prevState.form.password.value, data: '' },
          },
        },
      };
    });
  };

  render() {
    const formElementsArray = [];
    for (let key in this.state.form) {
      formElementsArray.push({
        id: key,
        data: this.state.form[key],
      });
    }

    let formAll = (
      <DefaultPageLayout
        type='LayoutNarrow'
        label={
          this.props.loading ? '' : this.state.isSignUp ? 'Sign-up' : 'Login'
        }>
        <Card className='Card'>
          <form onSubmit={this.onSubmitHandler} autoComplete='off'>
            <InputContext.Provider
              value={{
                changed: this.inputChangedHandler,
              }}>
              {formElementsArray.map((item) => (
                <ComponentFactory key={item.id} id={item.id} data={item.data} />
              ))}
              <div className={classes.ButtonWrapper}>
                <input ref={this.submitInputRef} type='submit' />

                <Button
                  reference={this.submitButtonRef}
                  type='Action'
                  onClick={() => {
                    this.submitInputRef.current.click();
                  }}>
                  Submit
                </Button>
              </div>
            </InputContext.Provider>
          </form>
        </Card>
        <Card className={'Card'}>
          <div className={classes.FlexGroupRow}>
            {this.state.isSignUp
              ? `Have an account? `
              : `Don't have an account? `}
            <Button
              className={classes.SwitchButton}
              type='WithPadding'
              onClick={this.switchAuthModeHandler}>
              <span className={classes.ButtonText}>
                {this.state.isSignUp ? 'Login' : 'Sign-up'}
              </span>
            </Button>
          </div>
        </Card>
      </DefaultPageLayout>
    );

    if (this.props.loading) {
      formAll = <Spinner />;
    }

    let content = null;
    if (this.props.isAuthenticated) {
      content = <Redirect to={this.props.authRedirectPath} />;
    } else {
      content = <div className={classes.Login}>{formAll}</div>;
    }
    return content;
  }
}

const mapStateToProps = (state) => {
  return {
    loading: state.auth.loading,
    error: state.auth.error,
    isAuthenticated: state.auth.token !== null,
    authRedirectPath: state.auth.authRedirectPath,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onAuth: (email, password, isSignup) => {
      return dispatch(actions.auth(email, password, isSignup));
    },
    // onSetAuthRedirectPath: () => dispatch(actions.setAuthRedirectPath('/')),
  };
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withErrorHandler(Auth, axios));