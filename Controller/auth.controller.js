const User = require('../Models/User')
const jwt = require('jsonwebtoken')
const sendgridmail = require('@sendgrid/mail')
const expressJWT = require('express-jwt')
const _ = require('lodash')
const { OAuth2Client } = require('google-auth-library')
const fetch = require('node-fetch');


sendgridmail.setApiKey(process.env.SENDGRID_API_KEY)

//Signup routing
exports.signup = (req, res) => {
  const { name, email, password } = req.body
  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: 'Account already exists with this email address'
      })
    }
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: '1h' }
    )

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account activation link`,
      html: `<h2>please use this link to activate your account</h2>
                     <h4>${process.env.CLIENT_URL}/auth/activate/${token}</h4>
                      <hr/>
                      <p>please donot share this link to anyone</p>
                      <p>${process.env.CLIENT_URL}</p>
                    `
    }
    sendgridmail
      .send(emailData)
      .then(sent => {
        return res.json({
          message: `Email has been send to ${email}.Follow the instruction to activate your account.`
        })
      })
      .catch(err => console.error(err))
  })
}

//Activation routing
exports.accountActivation = (req, res) => {
  const { token } = req.body
  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (
      err,
      decoded
    ) {
      if (err) {
        console.log('JWT ACCOUNT ACTIVATION ERROR', err)
        return res.status(400).json({
          error: 'Expired Link.SignUp again'
        })
      }
      const { name, email, password } = jwt.decode(token)
      const newUser = new User({ name, email, password })
      newUser.save((err, sucess) => {
        if (err) {
          console.log('Error while saving User to database', err)
          return res.status(401).json({
            error: 'Error SignUp.please try again'
          })
        }
        return res.status(200).json({
          message: 'Signup Sucess.Please Signin.'
        })
      })
    })
  } else {
    return res.status(400).json({
      message: 'Something went wrong.Please try again.'
    })
  }
}

//SignIn routing
exports.signin = (req, res) => {
  const { email, password } = req.body
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      res.status(400).json({
        error: 'User with this email doesnot exist.Please Signup'
      })
    } else if (!user.authenticate(password)) {
      res.status(400).json({
        error: 'Email and password donot match'
      })
    } else {
      //generate token
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
      })
      const { _id, name, email, role } = user

      return res.status(200).json({
        token,
        user: { _id, name, email, role }
      })
    }
  })
}

exports.requireSignin = expressJWT({
  secret: process.env.JWT_SECRET,
  algorithms: ['sha1', 'RS256', 'HS256']
})

exports.adminMiddleware = (req, res, next) => {
  User.findById({ _id: req.user._id }).exec((err, user) => {
    if (err || !user) {
      res.json({
        error: 'User not found.Please Signup'
      })
    }
    if (user.role !== 'admin') {
      return res.json({
        error: 'Admin resource.Acess deneid.'
      })
    }
    req.profile = user
    next()
  })
}

exports.forgotPassword = (req, res) => {
  const { email } = req.body
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with this email doesnot exist'
      })
    }

    const token = jwt.sign(
      { _id: user._id, name: user.name },
      process.env.JWT_RESET_PASSWORD,
      {
        expiresIn: '10m'
      }
    )

    return user.updateOne({ resetPasswordlink: token }).exec((err, sucess) => {
      if (err) {
        return res.status(400).json({
          error: 'Database connection error!'
        })
      } else {
        const emailData = {
          from: process.env.EMAIL_FROM,
          to: email,
          subject: `Password reset link`,
          html: `<h2>please use this link to reset your account password</h2>
                                 <h4>${process.env.CLIENT_URL}/auth/password/reset/${token}</h4>
                                  <hr/>
                                  <p>please donot share this link to anyone</p>
                                  <p>${process.env.CLIENT_URL}</p>
                                `
        }
        sendgridmail
          .send(emailData)
          .then(sent => {
            return res.json({
              message: `Email has been send to ${email}.Follow the instruction to reset your password.`
            })
          })
          .catch(err => console.error(err))
      }
    })
  })
}

exports.resetPassword = (req, res) => {
  const { resetPasswordlink, newPassword } = req.body

  if (resetPasswordlink) {
    jwt.verify(
      resetPasswordlink,
      process.env.JWT_RESET_PASSWORD,
      (err, decode) => {
        if (err) {
          return res.status(400).json({
            error: 'Expired Link.Try Again!'
          })
        } else {
          User.findOne({ resetPasswordlink }).exec((err, user) => {
            if (err || !user) {
              return res.status(400).json({
                error: 'Something went wrong.Try Again!'
              })
            }
            const updatedFields = {
              password: newPassword,
              resetPasswordlink: ''
            }
            user = _.extend(user, updatedFields)
            user.save((err, sucess) => {
              if (err) {
                return res.status(401).json({
                  error: 'Error.please try again'
                })
              }
              return res.status(200).json({
                message: 'Great.now you can login to your account.'
              })
            })
          })
        }
      }
    )
  } else {
    return res.status(400).json({
      error: 'Something went wrong.Try Again!'
    })
  }
}

const client = new OAuth2Client(process.env.APP_GOOGLE);

exports.googleLogin = (req, res) => {
  const { idToken } = req.body;
  client.verifyIdToken({ idToken, audience: process.env.APP_GOOGLE })
    .then(response => {
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
            const { _id, email, name, role } = user;
            return res.json({
              token, user: { _id, email, name, role }
            })
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                console.log('Error while saving:google', error);
                return res.status(400).json({
                  error: 'User signup failed with google'
                })
              }
              const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
              const { _id, email, name, role } = data;
              return res.json({
                token, user: { _id, email, name, role }
              })
            })
          }
        })
      } else {
        return res.status(400).json({
          error: 'Google login failed.Try again'
        })
      }
    })
}

exports.facebookLogin = (req, res) => {
  const { userid, accessToken } = req.body;

  const url = `https://graph.facebook.com/v2.11/${userid}/?fields=id,name,email&access_token=${accessToken}`;

  return (
      fetch(url, {
          method: 'GET'
      })
          .then(response => response.json())
          .then(response => {
              const { email, name } = response;
              User.findOne({ email }).exec((err, user) => {
                  if (user) {
                      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
                      const { _id, email, name, role } = user;
                      return res.json({
                          token,
                          user: { _id, email, name, role }
                      });
                  } else {
                      let password = email + process.env.JWT_SECRET;
                      user = new User({ name, email, password });
                      user.save((err, data) => {
                          if (err) {
                              console.log('ERROR FACEBOOK LOGIN ON USER SAVE', err);
                              return res.status(400).json({
                                  error: 'User signup failed with facebook'
                              });
                          }
                          const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
                          const { _id, email, name, role } = data;
                          return res.json({
                              token,
                              user: { _id, email, name, role }
                          });
                      });
                  }
              });
          })
          .catch(error => {
              res.status(400).json({
                  error: 'Facebook login failed. Try later'
              });
          })
  );
};
