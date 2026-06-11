import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    socket = io(baseURL, {
      transports: ["websocket"],
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
};
