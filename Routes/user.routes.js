const express = require('express');
const router = express.Router();

const {read,update} = require('../Controller/user.controller');
const {requireSignin,adminMiddleware} = require('../Controller/auth.controller');

router.get('/user/:id/',requireSignin,read);
router.put('/user/update',requireSignin,update);
router.put('/admin/update',adminMiddleware,update);

module.exports = router;