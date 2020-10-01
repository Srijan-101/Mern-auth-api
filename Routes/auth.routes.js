const express = require('express')
const router = express.Router()
const {
  signup,
  accountActivation,
  signin,
  forgotPassword,
  resetPassword,
  googleLogin,
  facebookLogin
} = require('../Controller/auth.controller')

//Validator middleware
const {
  useSignupValidator,
  useSigninValidator,
  ForgetValidator,
  ResetPasswordValidator
} = require('../Validators/auth')

const { runValidation } = require('../Validators/index')

router.post('/signup', useSignupValidator, runValidation, signup)
router.post('/account-activation', accountActivation)
router.post('/signin', useSigninValidator, runValidation, signin)

//forget password
router.post('/forgot-password',ForgetValidator,runValidation,forgotPassword);
router.put('/reset-password',ResetPasswordValidator,runValidation,resetPassword);

//google and facebook 
router.post('/google-login',googleLogin);
router.post('/facebook-login',facebookLogin);

module.exports = router
