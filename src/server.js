const fs = require('fs')
const admin = require('firebase-admin')
const express = require('express')
require('dotenv/config')
const mongoose = require('mongoose')
const ArticleSchema = require('./models/Article')

const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
)

admin.initializeApp({
    credential: admin.credential.cert(credentials)
})

const app = express()
app.use(express.json())

app.use(async (req, res, next) => {
    const { authtoken } = req.headers
    console.log({headers: req.headers})
    if(authtoken){
        try{
            req.user = await admin.auth().verifyIdToken(authtoken) 
        } catch (e) {
            return res.sendStatus(400)
        }
    }
    req.user = req.user || {}
    console.log({user: req.user})
    next()
})

app.get('/api/articles/:name', async(req, res) => {
    const { name } = req.params
    const { uid } = req.user

    const article = await ArticleSchema.findOne({name: name}) 
    if(article) {
        const upvoteIds = article.upvoteIds || []
        article.canUpvote = upvoteIds && !upvoteIds.includes(uid)
        res.json(article)
    }else {
        res.sendStatus(404)
    }
    
})

app.use((req, res, next) => {
    if(req.user){
        next()
    }else{
        res.sendStatus(401)
    }
})

app.put('/api/articles/:name/upvote', async(req, res) => {
    const {name} = req.params
    const {uid} = req.user

    const article = await ArticleSchema.findOne({name: name}) 

    console.log(article.upvoteIds)
    if(article) {
        const upvoteIds = article.upvoteIds || [] 
        const canUpvote = upvoteIds && !upvoteIds.includes(uid)

        if(canUpvote){
            console.log({uid: uid})
            await ArticleSchema.updateOne({name}, {
                $inc: {upvotes: 1},
                $push: {upvoteIds: uid},
            })
        }

        const updatedArticle = await ArticleSchema.findOne({name})  
        console.log(updatedArticle)
        res.json(updatedArticle)
    }else {
        res.send('That article doesn\'t exist')
    }
})

app.post('/api/articles/:name/comments', async (req, res) => {
    const { name } = req.params
    const { text } = req.body
    const { email } = req.user
    await ArticleSchema.updateOne({name}, {$push: {comments: {postedBy: email, text}}})
    const article = await ArticleSchema.findOne({name})
    if(article){
        res.json(article)
    }else{
        res.send('That article doesn\'t exist')
    }
})

app.listen(8000, () => {
    console.log('Server is listening on port 8000')
})

async function conncectDB(){
    try{
        await mongoose.connect(process.env.DATABASE)
        console.log(`Connected to: Database`)
    } catch (err) {
        console.log({message: err})
    }
}

conncectDB()