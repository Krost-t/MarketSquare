import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.ts";
import { generateUsername } from "unique-username-generator";
import { generateToken } from "../utils/generate.token.ts";

const registerHandler = async (req: Request, res: Response): Promise<Response> => {
    const { lastname, firstname, gender,dateOfBirth, phone, email, password } = req.body;

    const pseudo = generateUsername("_", 4);
    const userExists = await prisma.user.findUnique({
        where: { email: email, username: lastname }
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
            lastname,
            password: hashedPassword,
            gender,
            firstname,
            username: pseudo, // auto-généré
            dateOfBirth,
            phone
        }
    })

    // Generate and return a JWT token here for authentication
    const token = generateToken(user.id, res);

    return res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user.id,
            email: user.email,
            lastname: user.lastname,
            firstname: user.firstname,
            username: user.username,
            age: user.dateOfBirth,
            phone: user.phone
        },
        token,
    });
}

const loginHandler = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
         res.status(400).json({ message: "Invalid email or password" });
         return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
         res.status(400).json({ message: "Invalid email or password" });
         return;
    }

    // Generate and return a JWT token here for authentication
    const token = generateToken(user.id, res);

     res.status(200).json({
        message: "successfully logged in",
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstname: user.firstname,
        },
        token
    });
}

const logoutHandler = async (_req: Request, res: Response): Promise<void> => {
    res.cookie("jwt","",{
        expires: new Date(0),
        httpOnly: true,
        /* sameSite: "strict", */
    })
     res.status(200).json({ 
        status: "success",
        message: "successfully logged out" });
}

const forgotPasswordHandler = async (req: Request, res: Response): Promise<void> => {
    const { email, phone } = req.body;

       const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { phone: phone }
            ]
        }
    });

    if (!user) {
         res.status(400).json({ message: "Invalid email or phone" });
         return;
    }


    const token = generateToken(user.id, res);

     res.status(200).json({
        message: "successfully sent reset password email",
        token
    });
}

const resetPasswordHandler = async (req: Request, res: Response): Promise<void> => {}

export { registerHandler, loginHandler, logoutHandler, forgotPasswordHandler, resetPasswordHandler };