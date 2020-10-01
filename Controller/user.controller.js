const User = require('../Models/User')

exports.read = (req, res) => {
    const userId = req.params.id;
    User.findById(userId).exec((error, user) => {
        if (error || !user) {
            return res.status(400).json({
                error: "User not found"
            })
        } else {
            user.hased_password = undefined;
            user.salt = undefined;
            res.json(user);
        }
    })
}

exports.update = (req, res) => {
    //console.log('Req user',req.user,'updated user',req.body);
    const { name, password } = req.body;
    User.findOne({ _id: req.user._id }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found!'
            })
        }
        if (!name) {
            return res.status(400).json({
                error: 'Name is Required!'
            })
        } else {
            user.name = name;

        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    error: 'Password should be 6 characters long!'
                })
            } else {
                user.password = password;
            }
        }

        user.save((err,Updateduser) => {
             if(err){
                 return res.status(400),json({
                     error : 'User update Error!'
                 })
             }
                Updateduser.hased_password = undefined;
                Updateduser.salt = undefined;
                res.json(Updateduser); 
        })
    })
}