import { Socket } from "socket.io";
import { jwtService } from "@/services/jwt.service";

export async function socketAuthMiddleware(
  socket: Socket,
  next: (error?: Error) => void,
) {
  try {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.headers?.token as string);

    if (!token) return next(new Error("Authentication required"));

    const payload = await jwtService.verifyAccessToken(token);

    socket.data.userId = payload.sub;
    socket.data.email = payload.email;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
}
