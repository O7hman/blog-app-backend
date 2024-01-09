const mongoose = require('mongoose')

const ArticleSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    upvotes: {
        type: Number,
        required: true,
    },
    comments: {
        type: Array,
        required: true
    },
    upvoteIds: {
        type: Array,
        required: true
    }
})

module.exports = mongoose.model('articles', ArticleSchema)