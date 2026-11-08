const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        role: {
            type: String,
            enum: ["Admin", "Agent", "Customer"],
            default: "Customer"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving a new password
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(
        this.password,
        salt
    );
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (
    enteredPassword
) {
    return bcrypt.compare(
        enteredPassword,
        this.password
    );
};

module.exports = mongoose.model("User", userSchema);