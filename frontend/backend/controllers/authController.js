
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};

// Register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        // Public registration always creates a Customer.
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: "Customer"
        });

        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            token,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Registration Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials or inactive account."
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};

// Get logged-in user's profile
const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isActive: req.user.isActive
        }
    });
};

// Update logged-in user's profile
const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

        // Validate input
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            !name.trim() ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required."
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name cannot exceed 100 characters."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        // Find the authenticated user in MongoDB
        const user = await User.findById(req.user._id);

        if (!user || !user.isActive) {
            return res.status(404).json({
                success: false,
                message: "User account not found or inactive."
            });
        }

        // Check whether another account already uses this email
        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: user._id }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered to another account."
            });
        }

        // Update only permitted fields.
        // Never accept role, password or isActive from this request.
        user.name = normalizedName;
        user.email = normalizedEmail;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error("Profile Update Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update profile."
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile
};
