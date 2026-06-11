export interface createAuctionInput {
  sellerId: string;
  antiqueId: string;
  startingPrice: number;
  stepPrice: number;
  startsAt: Date;
  endsAt: Date;
}
