import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { getCurrentUser, getIdParam } from "../utils/request.ts";
import { stripUndefined } from "../utils/object.ts";
import { HttpError } from "../utils/http-error.ts";
import { createAddressSchema, updateAddressSchema } from "../validators/address.validator.ts";


const findMyAddressOrThrow = async (req: Request) => {
    const { id: userId } = getCurrentUser(req);
    const address = await prisma.address.findFirst({ where: { id: getIdParam(req), userId } });

    if (!address) {
        throw new HttpError(404, "Address not found");
    }
    return address;
};

const listMyAddressesHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);

    const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ status: "Success", data: addresses });
};

const getOneAddressHandler = async (req: Request, res: Response): Promise<void> => {
    const address = await findMyAddressOrThrow(req);

    res.status(200).json({ status: "Success", data: address });
};

const createAddressHandler = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = getCurrentUser(req);
    const data = createAddressSchema.parse(req.body);

    const address = await prisma.address.create({ data: { ...data, userId } });

    res.status(201).json({ status: "Success", data: address });
};

const updateAddressHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = await findMyAddressOrThrow(req);
    const data = stripUndefined(updateAddressSchema.parse(req.body));

    const address = await prisma.address.update({ where: { id }, data });

    res.status(200).json({ status: "Success", data: address });
};

const deleteAddressHandler = async (req: Request, res: Response): Promise<void> => {
    const { id } = await findMyAddressOrThrow(req);

    await prisma.address.delete({ where: { id } });

    res.status(200).json({ status: "Success", message: "Address deleted successfully" });
};

export {
    listMyAddressesHandler,
    getOneAddressHandler,
    createAddressHandler,
    updateAddressHandler,
    deleteAddressHandler,
};
