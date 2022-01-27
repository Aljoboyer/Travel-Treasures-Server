const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const fileUpload = require('express-fileupload'); 
const port = process.env.PORT || 5000;

//middleware 
app.use(cors()); 
app.use(express.json({limit: '50mb'}));
app.use(fileUpload());
app.use(express.urlencoded({limit: '50mb'}));

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.obwta.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try{
        await client.connect();

        const database = client.db('TravelBlogDB');
        const TravelBlogCollection = database.collection('TravelBlogCollection');
        const UserExperienceCollection = database.collection('UserExperienceCollection');
        const UserCollection = database.collection('UserCollection');

        //-----------OTHER API----------//
            //saving user to databse
            app.post('/SaveUser', async (req, res) => {
                const user = req.body
                const result = await UserCollection.insertOne(user)
                res.json(result)
            })
            //checking admin or not
            app.get('/checkAdmin', async (req, res) => {
                const email = req.query.email
                const query = {email: email}
                const user = await UserCollection.findOne(query)
                if(user.role === 'admin')
                {
                    res.send({isadmin: true})
                }
                else{
                    res.send('false')
                }
            })
        // ---------------ADMIN API----------------//

        //admin adding new blog information
        app.post('/addNewBlog', async (req, res) => {
            const data = req.body;
            const front = req.files.img.data;
            
            const encodedpic1 = front.toString('base64');
            const img = Buffer.from(encodedpic1, 'base64');

            const blog = {...data, img};
            const result = await TravelBlogCollection.insertOne(blog)
            res.json(result) 
        })
        //addmin geting request blog
        app.get('/getRequestBlog', async(req, res) => {
            const cursor = UserExperienceCollection.find({})
            const result = await cursor.toArray();
            res.send(result)
        })
        //admin geting approved blog id
        app.get('/getApprovedBlog/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await UserExperienceCollection.findOne(query)
            res.send(result)
        })
        //admin approving blog
        app.post('/ApprovingBlog', async (req, res) => {
            const data = req.body
            const result = await TravelBlogCollection.insertOne(data)
            res.json(result)
        })
        //admin  blog from request collection
        app.put('/updateRequest/:id', async (req, res) => {
            const data = req.body;
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const option = {upsert: true}
            const updatedoc = {
                $set: {
                    mark: data.mark
                }
            }
            const result = await UserExperienceCollection.updateOne(filter, updatedoc, option)
            res.json(result) 
        })
        //admin geting all blog for managing
        app.get('/getingAllBlog', async (req, res) => {
            const cursor = TravelBlogCollection.find({})
            const result = await cursor.toArray()
            res.send(result)
        })
        //geting blog for edit
        app.get('/getBlogForEdit/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await TravelBlogCollection.findOne(query)
            res.send(result)
        })
        //puting edited blog
        app.put('/EditedBlog/:id', async (req, res) =>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const data = req.body;
            const front = req.files.img.data;
            
            const encodedpic1 = front.toString('base64');
            const img = Buffer.from(encodedpic1, 'base64');

            const blog = {...data, img};
            const option = {upsert: true}
            const updatedoc = {
                $set: {
                    title : blog.title,
                    category : blog.category,
                    cost : blog.cost,
                    location : blog.location,
                    travelerinfo : blog.travelerinfo,
                    img : blog.img,
                    description : blog.description
                }
            }
            const result = await TravelBlogCollection.updateOne(filter, updatedoc, option)
            res.json(result) 
        })
        //making another admin
        app.put('/makeAdmin', async (req, res) => {
            const email = req.query.email
            const filter = {email: email}
            const option = {upsert: true}
            const updatedoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UserCollection.updateOne(filter, updatedoc, option)
            res.json(result) 
        })
        //amdin deleting blogs 
        app.delete('/deleteblog/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await TravelBlogCollection.deleteOne(query)
            res.send(result)
        })
        
    //--------------USER API-------------//
        //user geting all blogs
        app.get('/getBlogs', async (req, res) => {
            const cursor = TravelBlogCollection.find({})
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let result;
            const count = await cursor.count()
            if(page)
            {
                 result = await cursor.skip(page * size).limit(size).toArray()
            }
            else{
                result = await cursor.toArray();
            }
            res.send({
                result,
                count
            })
        })
        //user geting individual blog detials
        app.get('/getSingleBlock/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await TravelBlogCollection.findOne(query)
            res.send(result)
        })
        //user sharing their experince 
        app.post('/ShareExperience', async(req, res) => {
            const data = req.body;
            const front = req.files.img.data;
            
            const encodedpic1 = front.toString('base64');
            const img = Buffer.from(encodedpic1, 'base64');

            const blog = {...data, img};
            const result = await UserExperienceCollection.insertOne(blog)
            res.json(result) 
        })
        //lower expense 
        app.get('/getLowExpense', async (req, res) => {
            const query = { cost: { $lt: '2500' } };
            const result = await TravelBlogCollection.find(query).toArray();
            res.send(result)
        })
        app.get('/getTopRatedPlace', async (req, res) => {
            const query = { rate: { $gt: '4' } };
            const result = await TravelBlogCollection.find(query).toArray();
            res.send(result)
        })
    }
    finally{

    }
}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Travel Blog Server Is Connected');
})

app.listen(port, (req, res) => {
    console.log('Server Port Is', port)
})