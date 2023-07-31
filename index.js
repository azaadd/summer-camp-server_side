const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


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


        app.get('/lactures', async(req, res) => {
            const result = await lectureCollection.find().toArray();
            res.send(result);
        })
        

        app.get('/instructors', async(req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result);
        })

        // select collection
        app.get('/selectItems', async(req, res) => {
            const email = req.query.email;
            if(!email){
                res.send([]);
            }
            const query = { email: email };
            const result = await selectCollection.find(query).toArray();
            res.send(result);
        });


        app.post('/selectItems', async(req, res) => {
            const PClass = req.body;
            console.log(PClass);
            const result = await selectCollection.insertOne(PClass);
            res.send(result);
        })

        app.delete('/selectItems/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
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