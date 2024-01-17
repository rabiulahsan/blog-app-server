const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


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


//create  verifyJWT function
const verifyJWT = (req, res, next) => {
  console.log(req.headers);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
    
  }

  // bearer token
  const token = authorization.split(' ')[1];
  // console.log(token);

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: true, message: 'unauthorized access' })
     
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //database collection
    const usersCollection = client.db('blog-application').collection('users');
    const blogsCollection = client.db('blog-application').collection('blogs');
    const favouritesCollection = client.db('blog-application').collection('favourites');


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

  
//get all favourite post

app.get("/favourites", verifyJWT, async (req, res) => {
  const userEmail = req.query.email;
console.log(userEmail);

  if (!userEmail) {
    return res.status(400).send({ error: true, message: 'Email is required' });
  }

  const decodedEmail = req.decoded.email;

  if (userEmail !== decodedEmail) {
    return res.status(403).send({ error: true, message: 'Forbidden access' });
  }

  const query = {
    savesUserEmail: userEmail,
  };

  const result = await favouritesCollection.find(query).toArray();
  res.send(result);
});

   

   //get specific blog by id
   app.get("/:id", async (req, res) => {
    const id = req.params.id;
    console.log(req.params);
    console.log(id);
    const query = { _id: new ObjectId(id) };
    const result = await blogsCollection.findOne(query);
    res.send(result);
  });


  

  //saved favourite post
app.post('/favourites', verifyJWT, async(req, res)=>{
  const selectedBlog =req.body
  // console.log(selectedBlog);
  const result = await favouritesCollection.insertOne(selectedBlog)
  res.send(result)
})

//delete  selected post from favourite
app.delete('/favourites/:id', verifyJWT, async (req, res)=>{

  const blogsID = req.params.id;
      const query = {blogsID: blogsID}
      const result = await favouritesCollection.deleteOne(query);
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