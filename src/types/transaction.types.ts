import { Prisma } from "@prisma/client/extension";

export type PrismaTransactionClient = Prisma.TransactionClient;

export type IsolationLevels = "Serializable" | "RepeatableRead";
