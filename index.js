const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).send({ error: true, message: 'Unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_SECRET}@cluster0.chhf73q.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const lectureCollection = client.db('languageSchool').collection('lactures');
        const instructorCollection = client.db('languageSchool').collection('instructors');

        const selectCollection = client.db('languageSchool').collection('selectItems');

        const usersCollection = client.db('languageSchool').collection('usersInfo');


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h'})
            res.send({ token });
        })

        // users api
        app.get('/usersInfo', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })


        app.post('/usersInfo', async (req, res) => {
            const user = req.body;

            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exist' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        app.get('/usersInfo/admin/:email', verifyJWT, async(req, res) => {
            const email = req.params.email;

            if(req.decoded.email !== email){
                res.send({admin: false})
            }

            const query = {email: email}
            const user = await usersCollection.findOne(query);
            const result = {admin: user?.role === 'admin'};
            res.send(result);
        })


        app.patch('/usersInfo/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        app.get('/lactures', async (req, res) => {
            const result = await lectureCollection.find().toArray();
            res.send(result);
        })


        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result);
        })

        // select collection
        app.get('/selectItems', verifyJWT, async (req, res) => {
            const email = req.query.email;

            
            if (!email) {
                res.send([]);
            }

            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }

            const query = {email: email};
            const result = await selectCollection.find(query).toArray();
            res.send(result);
        });


        app.post('/selectItems', async (req, res) => {
            const selectItem = req.body;

            const query = { name: selectItem.name }
            const existingUser = await selectCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'You have already selected this class' })
            }

            console.log(selectItem);
            const result = await selectCollection.insertOne(selectItem);
            res.send(result);
        })

        app.delete('/selectItems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await selectCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('language school is running')
});

app.listen(port, () => {
    console.log(`language school is running on port: ${port}`);
})