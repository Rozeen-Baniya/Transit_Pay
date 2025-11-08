const mongoose = require('mongoose');


const transactionSchema = new  mongoose.Schema({
    type:{
        type: String,
        required: true,
        enum: ['Topup', 'Bus Fare', ]
    },
    amount:{
        type: String,
        required: true,
    },
    walletId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true,
    },
    remarks:{
        type: String,
        required: true
    },
}, { timestamps: true })


module.exports = mongoose.model('Transaction', transactionSchema);