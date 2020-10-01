const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config({path : './Configuration/.env'})


//connection to database
mongoose.connect(process.env.DATABASE,{
    useNewUrlParser : true,
    useFindAndModify : false,
    useCreateIndex : true,
    useUnifiedTopology: true
})
.then(() => console.log("Database connected Sucessfully!!!"))
.catch((err) => console.log("Database connection Error",err))


console.log(process.env.DATABASE);

//importing Routes
const Authroutes = require('./Routes/auth.routes')
const Userroutes = require('./Routes/user.routes')

//applying middlewares 
app.use(morgan('dev'));
app.use(bodyParser.json());

if (process.env.NODE_ENV = 'development') {
    //for cross-origin Resource Sharing
    app.use(cors({origin :'http://localhost:8887'}));
}

app.use('/api', Authroutes);
app.use('/api', Userroutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running at ${PORT} - ${process.env.NODE_ENV}`)
})