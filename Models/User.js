const mongoose = require('mongoose');
const crypto = require('crypto');
const { match } = require('assert');

//user Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        max: 15
    },
    email: {
        type: String,
        trim: true,
        required: true,
        lowercase: true,
        unique: true
    },
    hased_password: {
        type: String,
        required: true,
    },
    salt: {
        type: String
    },
    role: {
        type: String,
        default: 'subscriber'
    },
    resetPasswordlink: {
        data: String,
        default: ''
    }
}, { timestamps: true })

//virtual field 
userSchema.virtual('password')
.set(function(password){
    this._password = password;
    this.salt = this.makeSalt();
    this.hased_password = this.encryptPassword(password)
})
.get(function(){
    return this._password;
})

//methods 
userSchema.methods = {
    authenticate: function(plainText){
        return this.encryptPassword(plainText) === this.hased_password;
    },

    encryptPassword : function(password) {
        if(!password) return ''
        try {
            return crypto.createHmac('sha1',this.salt)
              .update(password)
              .digest('hex')
        }catch(error){
            return ''
        }
    },

    makeSalt : function() {
        return Math.round(new Date().valueOf() * Math.random()) + ''
    }
};


module.exports = mongoose.model('User',userSchema);