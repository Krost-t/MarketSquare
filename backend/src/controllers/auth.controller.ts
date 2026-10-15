import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.ts";
import { generateUsername } from "unique-username-generator";
import { generateToken, resetPasswordToken, verifyResetPasswordToken } from "../utils/generate.token.ts";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validators/auth.validator.ts";
import { toPublicUser } from "../utils/request.ts";

const generateFreeUsername = async (): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const pseudo = generateUsername("_", 4);
        const taken = await prisma.user.findUnique({ where: { username: pseudo } });
        if (!taken) return pseudo;
    }
    return `${generateUsername("_")}_${Date.now().toString(36)}`;
}

const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

const registerHandler = async (req: Request, res: Response): Promise<Response> => {
    const { lastname, firstname, gender, dateOfBirth, phone, email, password, role } = registerSchema.parse(req.body);

    const userExists = await prisma.user.findUnique({
        where: { email: email }
    });
    // Check if user already exists
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }
    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await prisma.user.create({
        data: {
            email,
            lastname,
            password: hashedPassword,
            gender,
            firstname,
            username: await generateFreeUsername(), // auto-généré
            dateOfBirth,
            phone,
            role,
        }
    })

    // Generate and return a JWT token here for authentication
    const token = generateToken(user.id, res);

    return res.status(201).json({
        message: "User registered successfully",
        user: toPublicUser(user),
        token,
    });
}

const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const loginHandler = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    const isPasswordValid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user) {
         res.status(400).json({ message: "Invalid email or password" });
         return;
    }

    if (!isPasswordValid) {
         res.status(400).json({ message: "Invalid email or password" });
         return;
    }

    // Generate and return a JWT token here for authentication
    const token = generateToken(user.id, res);

     res.status(200).json({
        message: "successfully logged in",
        user: toPublicUser(user),
        token
    });
}

const logoutHandler = async (_req: Request, res: Response): Promise<void> => {
    res.cookie("jwt","",{
        expires: new Date(0),
        httpOnly: true,
        sameSite: "strict",
    })
     res.status(200).json({
        status: "success",
        message: "successfully logged out" });
}

const forgotPasswordHandler = async (req: Request, res: Response): Promise<void> => {
    const { email, phone } = forgotPasswordSchema.parse(req.body);

       const user = await prisma.user.findFirst({
        where: {
            OR: [
                ...(email ? [{ email: email }] : []),
                ...(phone ? [{ phone: phone }] : []),
            ]
        }
    });

    const message = "If an account matches, a reset link has been sent";

    if (!user) {
         res.status(200).json({ message });
         return;
    }

    const token = resetPasswordToken(user.id, user.password);

    if (process.env.EXPOSE_RESET_TOKEN === "true") {
        res.status(200).json({ message, userId: user.id, token });
        return;
    }

     res.status(200).json({ message });
}

const resetPasswordHandler = async (req: Request, res: Response): Promise<void> => {
    const { userId, token, password } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    try {
        if (!user) throw new Error("User not found");
        verifyResetPasswordToken(token, user.password);
    } catch {
        res.status(400).json({ message: "Invalid or expired reset token" });
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password), passwordChangedAt: new Date() },
    });

    res.status(200).json({ message: "Password has been reset successfully" });
}

export { registerHandler, loginHandler, logoutHandler, forgotPasswordHandler, resetPasswordHandler, hashPassword, generateFreeUsername };
