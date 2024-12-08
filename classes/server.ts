import express from "express";
import http from "http";
import socketIO from "socket.io";
import { SERVER_PORT } from "../global/enviroment";
import { EnumSocket } from "../interfaces/EnumSocket";
import { UserInfo } from "../interfaces/UserInfo";
import { CustomSocket } from "../interfaces/CustomSocket";

export default class Server {
  private static _instance: Server;

  public app: express.Application;
  public port: number;

  public io: socketIO.Server;
  private httpServer: http.Server;

  private constructor() {
    this.app = express();
    this.port = SERVER_PORT;

    this.httpServer = new http.Server(this.app);
    this.io = new socketIO.Server(this.httpServer, {
      cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.escucharSockets();
  }

  public static get instance() {
    return this._instance || (this._instance = new Server());
  }

  private escucharSockets() {
    console.log("Escuchando conexiones");
    this.io.on("connection", (socket: CustomSocket) => {

      this.io
          .to(socket.id)
          .emit("data", {
            Type: EnumSocket.Open,
          });

      socket.on("join", ({ presupuesto, usuario }) => {
        console.log(`Usuario ${socket.id} conectándose a presupuesto ${presupuesto}`);

        socket.userInfo = { ...usuario, IdSocket: socket.id };

        socket.join(presupuesto);
        this.io
          .to(presupuesto)
          .emit("data", {
            Type: EnumSocket.UserOnline,
            Data: this.getUsersInRoom(presupuesto),
          });
        // console.log(this.getUsersInRoom(presupuesto));

        socket.on("replicate", (info) => {
          this.replicateData(socket, presupuesto, info);
        });

        socket.on("updateUserPartida", ({ nuevaPartida }) => {
          this.updateUserPartida(socket, presupuesto, nuevaPartida);
        });

        socket.on("updateUserConcepto", ({ nuevoConcepto }) => {
          this.updateUserConcepto(socket, presupuesto, nuevoConcepto);
        });

        socket.on("updateUserMatriz", ({ nuevaMatriz }) => {
          this.updateUserMatriz(socket, presupuesto, nuevaMatriz);
        });

        socket.on("disconnect", () => {
          console.log(`Usuario ${socket.id} desconectándose de presupuesto ${presupuesto}`);
          this.io
            .to(presupuesto)
            .emit("data", {
              Type: EnumSocket.UserOnline,
              Data: this.getUsersInRoom(presupuesto),
            });
          // console.log(this.getUsersInRoom(presupuesto));
        });
      });
    });
  }

  start(callback: () => void) {
    this.httpServer.listen(this.port, callback);
  }

  getUsersInRoom(room: any): UserInfo[] {
    const clients = this.io.sockets.adapter.rooms.get(room);
    if (clients) {
      return Array.from(clients).map((clientId) => {
        const socket = this.io.sockets.sockets.get(clientId) as CustomSocket;
        return socket ? socket.userInfo : null;
      }).filter((user) => user !== null) as UserInfo[];
    } else {
      return [];
    }
  }

  replicateData(socket: CustomSocket, presupuesto: string, info: any): void {
    const room = this.io.sockets.adapter.rooms.get(presupuesto);
  
    if (room) {
      const socketsInRoom = Array.from(room);
  
      // Filtrar los sockets para excluirte a ti mismo
      const socketsToSend = socketsInRoom.filter((clientId) => clientId !== socket.id);
  
      // Enviar la información actualizada a todos los sockets en la sala, excepto al remitente
      socketsToSend.forEach((clientId) => {
        const socketInRoom = this.io.sockets.sockets.get(clientId) as CustomSocket;
        socketInRoom.emit("data", info.info);
        console.log('enviando a', info.presupuesto);
        console.log('data', info.info);
      });
    }
  }

  updateUserPartida(socket: CustomSocket, presupuesto: string, nuevaPartida: string): void {

    if (socket.userInfo) {
      socket.userInfo.IdPartida = nuevaPartida;
    }

    const updatedUsers = this.getUsersInRoom(presupuesto);
    console.log(updatedUsers)
    this.io.to(presupuesto).emit("data", {
      Type: EnumSocket.UserOnline,
      Data: updatedUsers,
    });

  }

  updateUserConcepto(socket: CustomSocket, presupuesto: string, nuevoConcepto: string): void {

    if (socket.userInfo) {
      socket.userInfo.IdConcepto = nuevoConcepto;
    }

    const updatedUsers = this.getUsersInRoom(presupuesto);
    console.log(updatedUsers)
    this.io.to(presupuesto).emit("data", {
      Type: EnumSocket.UserOnline,
      Data: updatedUsers,
    });

  }

  updateUserMatriz(socket: CustomSocket, presupuesto: string, nuevaMatriz: string): void {

    if (socket.userInfo) {
      socket.userInfo.IdMatriz = nuevaMatriz;
    }

    const updatedUsers = this.getUsersInRoom(presupuesto);
    console.log(updatedUsers)
    this.io.to(presupuesto).emit("data", {
      Type: EnumSocket.UserOnline,
      Data: updatedUsers,
    });

  }

}