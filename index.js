const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//create  verifyJWT function
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


//database api 
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ylecqg.mongodb.net/?retryWrites=true&w=majority`;

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

    //database collection
    const usersCollection = client.db('blog-application').collection('users');
    const blogsCollection = client.db('blog-application').collection('blogs');


    //create api for JWT token
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
    
      res.send({ token })
    })

    //get all users
  app.get("/users", async (req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
  });

  // post a users 
  app.post('/users', async(req, res)=>{
  const user = req.body;
      const query = { email: user.email }
      const exist = await usersCollection.findOne(query);

      if (exist) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
})

   //get all blogs
   app.get("/blogs", async (req, res) => {
    const result = await blogsCollection.find().toArray();
    res.send(result);
  });

   //get specific blog by id
   app.get("/:id", async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const query = { _id: new ObjectId(id) };
    const result = await blogsCollection.findOne(query);
    res.send(result);
  });


  //here it can be done by query but i try it in another way
  //get blogs by categories
app.get("/blogs/:category",  async(req, res)=>{

console.log(req.params.category)
  
let query={}
if (req.params.category) {
      query = {
        category: req.params?.category,
      };
}
  const result = await blogsCollection.find(query).toArray();
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



//test
app.get('/', (req, res) => {
    res.send('Running')
  })
  
  app.listen(port, () => {
    console.log(`Running on port ${port}`);
  })