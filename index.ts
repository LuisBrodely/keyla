import Server from "./classes/server";
import bodyParser from "body-parser";
import cors from 'cors'

const server = Server.instance

server.app.use(bodyParser.urlencoded({ extended: true }))
server.app.use(bodyParser.json())

server.app.use(cors({ origin: true, credentials: true }))

server.app.use('/', (req, res) => {
	res.send('Hello world :D');
});

server.start(() => {
	console.log(`Servidor escuchando en el puerto ${ server.port }`)
})