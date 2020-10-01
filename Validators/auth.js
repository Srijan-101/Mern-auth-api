const {check} = require('express-validator');

exports.useSignupValidator = [
    check('name')
    .not()
    .isEmpty()
    .withMessage('Name is required'),

    check('email')
    .not()
    .isEmpty()
    .withMessage('Must be a valid email address'),

    check('password')
    .isLength({min : 6})
    .withMessage('Password must be atleast 6 characters long')
]

exports.useSigninValidator = [
    check('email')
    .not()
    .isEmpty()
    .withMessage('Must be a valid address'),

    check('password')
    .isLength({min : 6})
    .withMessage('Password must be atleast 6 characters long')
]

exports.ForgetValidator = [
    check('email')
    .not()
    .isEmpty()
    .withMessage('Must be a valid address'),
]

exports.ResetPasswordValidator = [
    check('newPassword')
    .not()
    .isEmpty()
    .isLength({min : 6})
    .withMessage('Password must be atleast 6 characters long')
]