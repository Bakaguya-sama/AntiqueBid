export interface ServerToClientEvents {
  "auction:price_updated": (data: {
    auctionId: string;
    currentPrice: number;
    bidderId: string;
    bidTime: string;
    newEndsAt?: string;
  }) => void;

  "auction:viewer_count": (data: {
    auctionId: string;
    viewerCount: number;
  }) => void;

  "auction:start": (data: { auctionId: string }) => void;

  "auction:finished": (data: {
    auctionId: string;
    winnerId: string | null;
  }) => void;

  "auction:error": (data: { auctionId: string; message: string }) => void;

  "auction:user_joined": (data: {
    auctionId: string;
    userId: string;
    viewerCount: number;
  }) => void;

  "auction:user_left": (data: {
    auctionId: string;
    userId: string;
    viewerCount: number;
  }) => void;

  "notification:new": (data: {
    id: string;
    type: string;
    message: string;
  }) => void;
}

export interface ClientToServerEvents {
  "auction:join": (auctionId: string) => void;
  "auction:leave": (auctionId: string) => void;
}

export interface SocketData {
  userId?: string;
  email?: string;
  joinedAuctions?: Set<string>;
}
