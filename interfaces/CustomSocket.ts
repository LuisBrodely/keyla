import { UserInfo } from "./UserInfo";
import { Socket } from "socket.io";

export interface CustomSocket extends Socket {
  userInfo?: UserInfo;
}
