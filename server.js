import express, { response } from 'express'
import cors from 'cors'
import { promises as fs } from 'node:fs'
import { request } from 'node:http'


const PORT = 3333
const DATABASE_URL = "./database/bustrack.json"
const app = express()

app.use(cors({
    origin:"*",
    methods:["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}))

app.use(express.json())

//cadastro de motoristas
app.post("/motoristas", async (request, response) =>{    
    const { nome, data_nascimento, carteira_habilitacao, onibus_id } = request.body;

    if(!nome){
        response.status(400).json({mensagem: "Nome é obrigatório"})  
        return                               
    }
    if(!data_nascimento){
        response.status(400).json({mensagem: "Data de nascimento é obrigatória"})
        return
    }
    if(!carteira_habilitacao){
        response.status(400).json({mensagem: "Habilitação é obrigatório"})
        return
    }   

    const novoMotorista = {
        id_motorista: Date.now().toString(),
        nome,
        data_nascimento,
        carteira_habilitacao,
        onibus_id: 0
    }

    try {
        const data = await fs.readFile(DATABASE_URL, 'utf-8')
        const db_motorista = await JSON.parse(data)

        db_motorista.motoristas.push(novoMotorista)

        await fs.writeFile(DATABASE_URL, JSON.stringify(db_motorista, null, 2));
        response.status(201).json({mensagem: "Motorista cadastrado", novoMotorista})

    } catch (error) {
        console.log(error)
        response.status(500).json({mensagem: "Internal server error"});
    }

})

//cadastro de onibus
app.post("/onibus", async (request, response) =>{
    const { placa, modelo, ano_fabricacao, capacidade, motorista_id } = request.body;

    if(!placa){
        response.status(400).json({mensagem: "Placa é obrigatória"})  
        return                               
    }
    if(!modelo){
        response.status(400).json({mensagem: "Modelo é obrigatório"})
        return
    }
    if(!ano_fabricacao){
        response.status(400).json({mensagem: "Ano de fabricação é obrigatório"})
        return
    }   
    if(!capacidade){
        response.status(400).json({mensagem: "Capacidade é obrigatório"})
        return
    }
    
    const novoOnibus = {
        id_onibus: Date.now().toString(),
        placa,
        modelo,
        ano_fabricacao,
        capacidade,
        motorista_id: 0
    }

    try {
        const data = await fs.readFile(DATABASE_URL, 'utf-8')
        const db_onibus = await JSON.parse(data)

        db_onibus.onibus.push(novoOnibus)

        await fs.writeFile(DATABASE_URL, JSON.stringify(db_onibus, null, 2));
        response.status(201).json({mensagem: "Onibus cadastrado", novoOnibus})

    } catch (error) {
        console.log(error)
        response.status(500).json({mensagem: "Internal server error"});
    }

})

//listagem de motorista
app.get("/motoristas", async (request, response) => {
    try {
        const data = await fs.readFile(DATABASE_URL, 'utf-8');
        const db_motoristas = await JSON.parse(data)

        if (!db_motoristas) {
            response.status(200).json({ mensagem: "Nenhum motorista cadastrado" })
        }

        response.status(200).json({ mensagem: "Lista de motoristas", data: db_motoristas.motoristas })
    } catch (error) {
        console.log(error)
        response.status(500).json({ mensagem: "Internal server error" })
    }
})

//listagem de onibus
app.get("/onibus", async (request, response) => {
    try {
        const data = await fs.readFile(DATABASE_URL, 'utf-8')
        const db_onibus = await JSON.parse(data)

        if (!db_onibus) {
            response.status(200).json({ mensagem: "Nenhum motorista cadastrado" })
        }

        response.status(200).json({ mensagem: "Lista de onibus", data: db_onibus.onibus })
    } catch (error) {
        console.log(error)
        response.status(500).json({ mensagem: "Internal server error" })
    }
})

app.put("/motoristas/:id/onibus", async (request, response) => {
    const { id } = request.params
    const { onibus_id } = request.body
    if (!onibus_id){

        response.status(400).json({mensagem:"ID do onibus é obrigatorio"})
        return
    }
    try {
        const data = await fs.readFile(DATABASE_URL, 'utf-8')
        const db = await JSON.parse(data)

        const motorista = db.motoristas.find((motorista) => motorista.id_motorista === id)
        console.log(motorista)
        
        const onibus = db.onibus.find((onibus)=>onibus.id_onibus === onibus_id)

        if(!motorista || !onibus){
            response.status(400).json({mensagem:"Motorista ou ônibus inválido"})
            return
        }

        motorista.onibus_id = onibus_id
        onibus.motorista_id = id

        await fs.writeFile(DATABASE_URL, JSON.stringify(db, null, 2))
        response.status(201).json({mensagem:"Vinculo reralizado"})
    } catch (error) {
        console.log(error)
        response.status(500).json({mensagem:"Internal server error"})
    }
})

app.get("/onibus/:id/motorista", async (request,response) => {
    const { id } = request.params
    try {
        const data = await fs.readFile(DATABASE_URL, 'utf-8')
        const db = await JSON.parse(data)

        const encontrarOnibus = db.onibus.find((onibus)=> onibus.id_onibus === id)
        if(!encontrarOnibus){
            response.status(404).json({mensagem:"ônibus não encontrado"})
            return
        }

        const infoMotorista = db.motoristas.find((motorista) => motorista.id_motorista === encontrarOnibus.motorista_id)

        const infoMotoristaOnibus = {
            "onibus": encontrarOnibus,
            "motorista": infoMotorista == undefined ? "Não existe vinculo": infoMotorista
        }
        response.status(200).json(infoMotoristaOnibus)
    } catch (error) {
        console.log(error)
        response.status(500).json({mensagem:"Internal server error"})
    }
})

app.delete("/onibus/:id/motorista", async (request, response) => {
    const { id } = request.params

    try {
        const data = await fs.readFile(DATABASE_URL, 'utf-8')
        const db = await JSON.parse(data)

        const encontrarOnibus = db.onibus.find((onibus) => onibus.id_onibus === id)

        
        if(!encontrarOnibus){
            response.status(404).json({mensagem:"ônibus não encontrado"})
            return
        }

        const encontrarVinculomotorista = db.motoristas.find((motorista) => motorista.id_motorista === encontrarOnibus.motorista_id)
        if(!encontrarVinculomotorista){
            response.status(404).json({mensagem:"Não existe motorista para esse onibus"})
            return
        }

        encontrarOnibus.motorista_id = 0
        encontrarVinculomotorista.onibus_id = 0

        await fs.writeFile(DATABASE_URL, JSON.stringify(db,null,2))

        response.status(200).json({mensagem:"onibus desvinculado com sucesso"})

    } catch (error) {
        
    }
})

app.listen(PORT, () => {
    console.log("Servidor iniciado na porta " + PORT);
})