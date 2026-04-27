import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.ts";
import { generateUsername } from "unique-username-generator";
import { generateToken } from "../utils/generate.token.ts";

const registerHandler = async (req: Request, res: Response) => {
    const { username, firstname, email, password } = req.body;

    const pseudo = generateUsername("_", 4);
    const userExists = await prisma.user.findUnique({
        where: { email: email, username: username }
    });
    // Check if user already exists
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = await prisma.user.create({
        data: {
            email,
            username,
            password: hashedPassword,
            firstname,
            surname: pseudo, // auto-généré
        }
    })

    // Generate and return a JWT token here for authentication
    const token = generateToken(user.id, res);

    return res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstname: user.firstname,
            surname: user.surname
        },
        token,
    });
}

const loginHandler = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate and return a JWT token here for authentication
    const token = generateToken(user.id, res);

    return res.status(200).json({
        message: "successfully logged in",
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstname: user.firstname,
            surname: user.surname
        },
        token
    });
}

const logoutHandler = async (_req: Request, res: Response) => {
    res.cookie("jwt","",{
        expires: new Date(0),
        httpOnly: true,
        /* sameSite: "strict", */
    })
    res.status(200).json({ 
        status: "success",
        message: "successfully logged out" });
}


export { registerHandler, loginHandler, logoutHandler };