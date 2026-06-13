import { prisma } from "@/config/db.connection";
import { PrismaTransactionClient } from "@/types/transaction.types";

export class AuctionAntiqueRepository {
  async createMany(
    auctionId: string,
    antiqueIds: string[],
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return client.auctionAntique.createMany({
      data: antiqueIds.map((antiqueId) => ({ auctionId, antiqueId })),
      skipDuplicates: true,
    });
  }

  async deleteByAuctionId(auctionId: string, tx?: PrismaTransactionClient) {
    const client = tx ?? prisma;
    return client.auctionAntique.deleteMany({
      where: { auctionId },
    });
  }

  async findByAuctionId(auctionId: string, tx?: PrismaTransactionClient) {
    const client = tx ?? prisma;
    return await client.auctionAntique.findMany({
      where: { auctionId },
    });
  }
}

export const auctionAntiqueReposistory = new AuctionAntiqueRepository();
