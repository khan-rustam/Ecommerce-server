const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: function() {
            return !this.phoneNumber;
        },
        unique: true,
        sparse: true,
    },
    phoneNumber: {
        type: String,
        required: function() {
            return !this.email;
        },
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);